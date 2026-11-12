import { debugForFile } from "debug-for-file";
import { isExpression, SyntaxKind, type Node } from "typescript-native/ast";
import {
	ObjectFlags,
	SymbolFlags,
	TypeFlags,
	type APIRequestGenerator,
	type Checker,
	type JSDocTagInfo,
	type ObjectType,
	type Signature,
	type Symbol,
	type Type,
	type TypeReference,
} from "typescript-native/sync";

import type * as AST from "./types/ast.ts";
import { forEachChild } from "./utils/forEachChild.ts";
import { getTypeProperty } from "./utils/getTypeProperty.ts";

const log = debugForFile(import.meta.filename);

/**
 * Single-node `getTypeAtLocation` misses in one file before the rest of the
 * file's expression types are fetched in one request. A file that few rules
 * ask about stays on single requests; one that many rules ask about is
 * cheaper to fetch wholesale.
 */
const typePrefetchAfterMisses = 8;

/**
 * Files with at most this many expressions are prefetched after the second
 * miss instead: the whole file costs about as much as one more request.
 */
const typePrefetchSmallFileExpressions = 64;

/**
 * Files with more prefetched nodes than this are never type-prefetched: the
 * response would be large, and resolving every expression's type could cost
 * the native process more than the round trips it saves.
 */
const typePrefetchMaxExpressions = 4000;

/**
 * Answers to pure checker queries, kept for as long as the checker (and so
 * its snapshot) lives. Every entry is keyed by an object the checker's own
 * registry hands out once per snapshot, so nothing outlives the snapshot it
 * was computed in.
 */
interface CheckerMemos {
	aliasedBySymbol: WeakMap<Symbol, Symbol>;
	apparentByPrimitiveFlags: Map<TypeFlags, Type>;
	baseConstraintByType: WeakMap<Type, Type | undefined>;
	immediateAliasedBySymbol: WeakMap<Symbol, Symbol | undefined>;
	isArrayByTarget: Map<number, boolean>;
	isArrayByType: WeakMap<Type, boolean>;
	jsDocTagsBySymbol: WeakMap<Symbol, readonly JSDocTagInfo[]>;
	signatureByNode: WeakMap<Node, Signature>;
	typeArgumentsByType: WeakMap<TypeReference, readonly Type[]>;
	typeByNode: WeakMap<Node, Type>;
	typeBySymbol: WeakMap<Symbol, Type>;
	typeElsewhereBySymbol: WeakMap<Symbol, Type>;
}

const memosByChecker = new WeakMap<Checker, CheckerMemos>();

const constrainedTypeFlags =
	TypeFlags.Index |
	TypeFlags.InstantiableNonPrimitive |
	TypeFlags.StringMapping |
	TypeFlags.TemplateLiteral |
	TypeFlags.UnionOrIntersection;

const primitiveApparentTypeFlags = [
	TypeFlags.BigInt | TypeFlags.BigIntLiteral,
	TypeFlags.BooleanLiteral,
	TypeFlags.ESSymbol | TypeFlags.UniqueESSymbol,
	TypeFlags.NonPrimitive,
	TypeFlags.Number | TypeFlags.NumberLiteral,
	TypeFlags.String | TypeFlags.StringLiteral,
];

export type BatchRequests = <Result>(
	generators: readonly APIRequestGenerator<Result>[],
) => Result[];

function getMemos(checker: Checker): CheckerMemos {
	let memos = memosByChecker.get(checker);
	if (!memos) {
		memos = {
			aliasedBySymbol: new WeakMap(),
			apparentByPrimitiveFlags: new Map(),
			baseConstraintByType: new WeakMap(),
			immediateAliasedBySymbol: new WeakMap(),
			isArrayByTarget: new Map(),
			isArrayByType: new WeakMap(),
			jsDocTagsBySymbol: new WeakMap(),
			signatureByNode: new WeakMap(),
			typeArgumentsByType: new WeakMap(),
			typeByNode: new WeakMap(),
			typeBySymbol: new WeakMap(),
			typeElsewhereBySymbol: new WeakMap(),
		};
		memosByChecker.set(checker, memos);
	}
	return memos;
}

function memoized<Key extends object, Value>(
	cache: WeakMap<Key, Value>,
	key: Key,
	compute: () => Value,
): Value {
	if (cache.has(key)) {
		return cache.get(key) as Value;
	}
	const value = compute();
	cache.set(key, value);
	return value;
}

/**
 * Wraps a project's checker so that rules' queries cost as few requests to
 * the native process as possible.
 *
 * Every checker query is a synchronous round trip, and rules repeat them:
 * several ask for the symbol of every identifier they visit, several ask for
 * the type of the same expression, and the same property of the same type
 * is looked up once per file. The wrapper answers:
 *
 * - Symbol lookups for a file's names, property accesses, and module
 *   specifiers from one batched request, fetched on the first lookup.
 * - Type lookups from one batched request for the file's expressions, once
 *   enough single lookups have shown the file to be worth it.
 * - Every other pure query from the answer to the same query on the same
 *   object earlier in the snapshot, whichever file asked.
 *
 * Nothing is fetched until a rule asks, so files no rule queries cost
 * nothing extra, and every answer is exactly what the checker would return.
 */
export function createCachedChecker(
	checker: Checker,
	sourceFile: AST.SourceFile,
	batch: BatchRequests,
): Checker {
	const memos = getMemos(checker);
	let symbolsByNode: Map<Node, Symbol | undefined> | undefined;
	let typeMisses = 0;
	let typesPrefetched = false;

	const isInFile = (node: Node) => node.getSourceFile() === sourceFile;

	const collectNodes = (predicate: (node: AST.AnyNode) => boolean): Node[] => {
		const nodes: Node[] = [];
		const collect = (node: AST.AnyNode): undefined => {
			if (predicate(node)) {
				nodes.push(node);
			}
			forEachChild(node, collect);
		};
		forEachChild(sourceFile, collect);
		return nodes;
	};

	// Prefetches also ask after nodes and symbols no rule has asked about, so a
	// failure answering any of them falls back to asking about each alone.
	const tryPrefetch = <Result>(request: () => Result): Result | undefined => {
		try {
			return request();
		} catch (error) {
			log("Prefetching checker request failed; asking individually: %o", error);
			return undefined;
		}
	};

	const tryBatch = <Result>(
		generators: readonly APIRequestGenerator<Result>[],
	): Result[] | undefined =>
		generators.length ? tryPrefetch(() => batch(generators)) : undefined;

	const prefetchSymbols = (): Map<Node, Symbol | undefined> => {
		const nodes = collectNodes(isSymbolPrefetched);
		const symbols = tryPrefetch(() => checker.getSymbolAtLocation(nodes));
		return new Map(
			symbols && nodes.map((node, index) => [node, symbols[index]]),
		);
	};

	// A property access resolves to the same symbol as its name, so only the
	// name is fetched and the access is answered from it.
	const getPrefetchedSymbolNode = (node: Node): Node =>
		node.kind === SyntaxKind.PropertyAccessExpression
			? (node as AST.PropertyAccessExpression).name
			: node;

	function getSymbolAtLocation(node: Node): Symbol | undefined;
	function getSymbolAtLocation(nodes: readonly Node[]): (Symbol | undefined)[];
	function getSymbolAtLocation(
		nodeOrNodes: Node | readonly Node[],
	): (Symbol | undefined)[] | Symbol | undefined {
		if (Array.isArray(nodeOrNodes)) {
			return checker.getSymbolAtLocation(nodeOrNodes as readonly Node[]);
		}
		const node = nodeOrNodes as Node;
		if (!isSymbolAnswerable(node as AST.AnyNode) || !isInFile(node)) {
			return checker.getSymbolAtLocation(node);
		}
		symbolsByNode ??= prefetchSymbols();
		const prefetchedNode = getPrefetchedSymbolNode(node);
		return symbolsByNode.has(prefetchedNode)
			? symbolsByNode.get(prefetchedNode)
			: checker.getSymbolAtLocation(node);
	}

	let jsDocTagsPrefetched = false;

	const prefetchJsDocTags = (): void => {
		jsDocTagsPrefetched = true;
		symbolsByNode ??= prefetchSymbols();
		const symbols = [...new Set(symbolsByNode.values())].filter(
			(symbol): symbol is Symbol =>
				!!symbol && !memos.jsDocTagsBySymbol.has(symbol),
		);
		const tags = tryBatch(
			symbols.map((symbol) => checker.getJsDocTagsOfSymbol.gen(symbol)),
		);
		for (const [index, symbol] of symbols.entries()) {
			const symbolTags = tags?.[index];
			if (symbolTags) {
				memos.jsDocTagsBySymbol.set(symbol, symbolTags);
			}
		}
	};

	const getJsDocTagsOfSymbol = (symbol: Symbol): readonly JSDocTagInfo[] => {
		if (!jsDocTagsPrefetched && !memos.jsDocTagsBySymbol.has(symbol)) {
			prefetchJsDocTags();
		}
		return memoized(memos.jsDocTagsBySymbol, symbol, () =>
			checker.getJsDocTagsOfSymbol(symbol),
		);
	};

	let aliasesPrefetched = false;

	// Rules that resolve one of a file's imports usually resolve them all.
	const prefetchAliases = (): void => {
		aliasesPrefetched = true;
		symbolsByNode ??= prefetchSymbols();
		const aliases = [...new Set(symbolsByNode.values())].filter(
			(symbol): symbol is Symbol =>
				!!symbol &&
				!!(symbol.flags & SymbolFlags.Alias) &&
				!memos.aliasedBySymbol.has(symbol),
		);
		const answers = tryBatch<Symbol | undefined>(
			aliases.flatMap((alias) => [
				checker.getAliasedSymbol.gen(alias),
				checker.getImmediateAliasedSymbol.gen(alias),
			]),
		);
		if (!answers) {
			return;
		}
		for (const [index, alias] of aliases.entries()) {
			const aliased = answers[index * 2];
			if (aliased) {
				memos.aliasedBySymbol.set(alias, aliased);
			}
			memos.immediateAliasedBySymbol.set(alias, answers[index * 2 + 1]);
		}
	};

	const getAliasedSymbol = (symbol: Symbol): Symbol => {
		if (!aliasesPrefetched && !memos.aliasedBySymbol.has(symbol)) {
			prefetchAliases();
		}
		return memoized(memos.aliasedBySymbol, symbol, () =>
			checker.getAliasedSymbol(symbol),
		);
	};

	const getImmediateAliasedSymbol = (symbol: Symbol): Symbol | undefined => {
		if (!aliasesPrefetched && !memos.immediateAliasedBySymbol.has(symbol)) {
			prefetchAliases();
		}
		return memoized(memos.immediateAliasedBySymbol, symbol, () =>
			checker.getImmediateAliasedSymbol(symbol),
		);
	};

	let signaturesPrefetched = false;

	const prefetchSignatures = (): void => {
		signaturesPrefetched = true;
		const calls = collectNodes(isCall).filter(
			(call) => !memos.signatureByNode.has(call),
		);
		const signatures = tryBatch(
			calls.map((call) => checker.getResolvedSignature.gen(call)),
		);
		if (!signatures) {
			return;
		}
		for (const [index, call] of calls.entries()) {
			const signature = signatures[index];
			if (signature) {
				memos.signatureByNode.set(call, signature);
			}
		}
		unprefetchedParameterSignatures = signatures;
	};

	let unprefetchedParameterSignatures: readonly Signature[] | undefined;

	// Rules that ask for the type of one of a file's resolved signatures'
	// parameters usually go on to ask for the others.
	const prefetchParameterTypes = (signatures: readonly Signature[]): void => {
		unprefetchedParameterSignatures = undefined;
		const parameterLists = tryBatch(
			[...new Set(signatures)].map((signature) =>
				signature.getParameters.gen(),
			),
		);
		const parameters = [...new Set(parameterLists?.flat())].filter(
			(parameter) => !memos.typeBySymbol.has(parameter),
		);
		if (!parameters.length) {
			return;
		}
		const types = tryBatch([checker.getTypeOfSymbol.gen(parameters)])?.[0];
		for (const [index, parameter] of parameters.entries()) {
			const type = types?.[index];
			if (type) {
				memos.typeBySymbol.set(parameter, type);
			}
		}
	};

	const getResolvedSignature = (node: Node): Signature => {
		if (
			!signaturesPrefetched &&
			!memos.signatureByNode.has(node) &&
			isInFile(node)
		) {
			prefetchSignatures();
		}
		return memoized(memos.signatureByNode, node, () =>
			checker.getResolvedSignature(node),
		);
	};

	let expressions: Node[] | undefined;

	const prefetchTypes = (): void => {
		typesPrefetched = true;
		const nodes = (expressions ?? []).filter(
			(node) => !memos.typeByNode.has(node),
		);
		if (!nodes.length) {
			return;
		}
		const types = tryPrefetch(() => checker.getTypeAtLocation(nodes));
		for (const [index, node] of nodes.entries()) {
			const type = types?.[index];
			if (type) {
				memos.typeByNode.set(node, type);
			}
		}
	};

	const shouldPrefetchTypes = (): boolean => {
		if (typeMisses < 2) {
			return false;
		}
		expressions ??= collectNodes(isTypePrefetched);
		if (expressions.length > typePrefetchMaxExpressions) {
			typesPrefetched = true;
			return false;
		}
		return (
			expressions.length <= typePrefetchSmallFileExpressions ||
			typeMisses >= typePrefetchAfterMisses
		);
	};

	function getTypeAtLocation(node: Node): Type;
	function getTypeAtLocation(nodes: readonly Node[]): Type[];
	function getTypeAtLocation(
		nodeOrNodes: Node | readonly Node[],
	): Type | Type[] {
		if (Array.isArray(nodeOrNodes)) {
			return checker.getTypeAtLocation(nodeOrNodes as readonly Node[]);
		}
		const node = nodeOrNodes as Node;
		const known = memos.typeByNode.get(node);
		if (known) {
			return known;
		}
		if (!typesPrefetched && isInFile(node)) {
			typeMisses += 1;
			if (shouldPrefetchTypes()) {
				prefetchTypes();
				const prefetched = memos.typeByNode.get(node);
				if (prefetched) {
					return prefetched;
				}
			}
		}
		return memoized(memos.typeByNode, node, () =>
			checker.getTypeAtLocation(node),
		);
	}

	// A plain object type is its own apparent type, and every primitive of a
	// kind shares the apparent type of its global, such as `String`.
	const getApparentType = (type: Type): Type => {
		if (
			type.flags & TypeFlags.Object &&
			!((type as ObjectType).objectFlags & ObjectFlags.Mapped)
		) {
			return type;
		}
		const primitiveFlags = primitiveApparentTypeFlags.find(
			(flags) => type.flags & flags,
		);
		if (primitiveFlags === undefined) {
			return checker.getApparentType(type);
		}
		let apparentType = memos.apparentByPrimitiveFlags.get(primitiveFlags);
		if (!apparentType) {
			apparentType = checker.getApparentType(type);
			memos.apparentByPrimitiveFlags.set(primitiveFlags, apparentType);
		}
		return apparentType;
	};

	// Only these types, and tuples (which may be variadic), have constraints.
	const getBaseConstraintOfType = (type: Type): Type | undefined =>
		type.flags & constrainedTypeFlags || type.isTupleType()
			? memoized(memos.baseConstraintByType, type, () =>
					checker.getBaseConstraintOfType(type),
				)
			: undefined;

	// Whether a type reference is to an array depends only on its target.
	const isArrayType = (type: Type): boolean => {
		if (
			!(type.flags & TypeFlags.Object) ||
			!((type as ObjectType).objectFlags & ObjectFlags.Reference)
		) {
			return false;
		}
		const { target } = type as Type & { target?: number };
		if (target === undefined) {
			return memoized(memos.isArrayByType, type, () =>
				checker.isArrayType(type),
			);
		}
		let isArray = memos.isArrayByTarget.get(target);
		if (isArray === undefined) {
			isArray = checker.isArrayType(type);
			memos.isArrayByTarget.set(target, isArray);
		}
		return isArray;
	};

	const getTypeOfSymbol = (symbol: Symbol): Type => {
		if (unprefetchedParameterSignatures && !memos.typeBySymbol.has(symbol)) {
			prefetchParameterTypes(unprefetchedParameterSignatures);
		}
		return memoized(memos.typeBySymbol, symbol, () =>
			checker.getTypeOfSymbol(symbol),
		);
	};

	// Away from where a symbol can be narrowed or written to, its type at a
	// location is its own, so one answer serves every such location.
	const getTypeOfSymbolAtLocation = (symbol: Symbol, location: Node): Type =>
		symbol.flags & SymbolFlags.ExportValue ||
		isTypeOfSymbolLocation(symbol, location as AST.AnyNode)
			? checker.getTypeOfSymbolAtLocation(symbol, location)
			: memoized(memos.typeElsewhereBySymbol, symbol, () =>
					checker.getNonMissingTypeOfSymbol(symbol),
				);

	const overrides = {
		getAliasedSymbol,
		getApparentType,
		getBaseConstraintOfType,
		getImmediateAliasedSymbol,
		getJsDocTagsOfSymbol,
		getPropertyOfType: (type: Type, name: string) =>
			getTypeProperty(type, name),
		getResolvedSignature,
		getSymbolAtLocation,
		getTypeArguments: (type: TypeReference) =>
			memoized(memos.typeArgumentsByType, type, () =>
				checker.getTypeArguments(type),
			),
		getTypeAtLocation,
		getTypeOfSymbol,
		getTypeOfSymbolAtLocation,
		isArrayType,
	} satisfies Partial<Record<keyof Checker, (...args: never[]) => unknown>>;

	// The checker's methods close over the checker itself rather than `this`,
	// so an object inheriting from it can override some without breaking the
	// rest. Each override keeps the original's generator form for callers
	// that batch requests themselves.
	return Object.create(
		checker,
		Object.fromEntries(
			Object.entries(overrides).map(([name, override]) => [
				name,
				{
					value: Object.assign(override, {
						gen: (checker[name as keyof Checker] as { gen: unknown }).gen,
					}),
				},
			]),
		),
	) as Checker;
}

function isCall(node: AST.AnyNode): boolean {
	return (
		node.kind === SyntaxKind.CallExpression ||
		node.kind === SyntaxKind.NewExpression
	);
}

function isTypeOfSymbolLocation(symbol: Symbol, node: AST.AnyNode): boolean {
	switch (node.kind) {
		// An identifier is only narrowed as a reference to the symbol it names.
		case SyntaxKind.Identifier:
			return (
				node.text === symbol.name ||
				node.parent.kind === SyntaxKind.PropertyAccessExpression ||
				node.parent.kind === SyntaxKind.QualifiedName
			);
		case SyntaxKind.PrivateIdentifier:
			return true;
		case SyntaxKind.SourceFile:
			return false;
		default:
			return (
				(node.parent.kind === SyntaxKind.SetAccessor &&
					node.parent.name === node) ||
				(node.parent.kind === SyntaxKind.ElementAccessExpression &&
					node.parent.argumentExpression === node)
			);
	}
}

// The nodes rules ask for the types of: expressions, and functions and
// methods themselves. An identifier that only names a declaration, member, or
// type is rarely asked about, and resolving all of them would cost the native
// process more than the round trips it saves.
function isTypePrefetched(node: AST.AnyNode): boolean {
	switch (node.kind) {
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.MethodDeclaration:
			return true;
		case SyntaxKind.Identifier:
			return isValueIdentifier(node);
		default:
			return isExpression(node);
	}
}

function isValueIdentifier(node: AST.Identifier): boolean {
	const { parent } = node;
	switch (parent.kind) {
		case SyntaxKind.ExportSpecifier:
		case SyntaxKind.ImportClause:
		case SyntaxKind.ImportSpecifier:
		case SyntaxKind.NamespaceExport:
		case SyntaxKind.NamespaceImport:
		case SyntaxKind.QualifiedName:
		case SyntaxKind.TypeReference:
			return false;
		case SyntaxKind.ShorthandPropertyAssignment:
			return true;
		default:
			return (parent as { readonly name?: AST.Node }).name !== node;
	}
}

// The nodes rules and Flint itself ask for the symbols of in bulk: names and
// the module specifiers of imports and re-exports.
function isSymbolAnswerable(node: AST.AnyNode): boolean {
	return (
		node.kind === SyntaxKind.PropertyAccessExpression ||
		isSymbolPrefetched(node)
	);
}

function isSymbolPrefetched(node: AST.AnyNode): boolean {
	switch (node.kind) {
		case SyntaxKind.Identifier:
			return !isUnqueriedDeclarationName(node);
		case SyntaxKind.PrivateIdentifier:
			return true;
		case SyntaxKind.StringLiteral:
			return (
				(node.parent.kind === SyntaxKind.ImportDeclaration ||
					node.parent.kind === SyntaxKind.ExportDeclaration) &&
				node.parent.moduleSpecifier === node
			);
		default:
			return false;
	}
}

// Rules ask after what a name refers to, rarely after the declaration a name
// introduces, so these names are left to single lookups.
function isUnqueriedDeclarationName(node: AST.Identifier): boolean {
	switch (node.parent.kind) {
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.InterfaceDeclaration:
		case SyntaxKind.Parameter:
		case SyntaxKind.TypeAliasDeclaration:
		case SyntaxKind.VariableDeclaration:
			return node.parent.name === node;
		default:
			return false;
	}
}
