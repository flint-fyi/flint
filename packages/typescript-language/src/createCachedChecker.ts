import {
	isExpression,
	SyntaxKind,
	type Node,
} from "typescript-native/unstable/ast";
import type {
	Checker,
	Signature,
	SignatureKind,
	Symbol,
	Type,
	TypeReference,
} from "typescript-native/unstable/sync";

import type * as AST from "./types/ast.ts";
import { forEachChild } from "./utils/forEachChild.ts";
import { getTypeProperty } from "./utils/getTypeProperty.ts";

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
 * Files with more expressions than this are never type-prefetched: the
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
	apparentByType: WeakMap<Type, Type>;
	baseConstraintByType: WeakMap<Type, Type | undefined>;
	immediateAliasedBySymbol: WeakMap<Symbol, Symbol | undefined>;
	isArrayByType: WeakMap<Type, boolean>;
	returnTypeBySignature: WeakMap<Signature, Type>;
	signatureByNode: WeakMap<Node, Signature>;
	signaturesByType: WeakMap<Type, Map<SignatureKind, readonly Signature[]>>;
	typeArgumentsByType: WeakMap<TypeReference, readonly Type[]>;
	typeByNode: WeakMap<Node, Type>;
	typeBySymbol: WeakMap<Symbol, Type>;
}

const memosByChecker = new WeakMap<Checker, CheckerMemos>();

function getMemos(checker: Checker): CheckerMemos {
	let memos = memosByChecker.get(checker);
	if (!memos) {
		memos = {
			aliasedBySymbol: new WeakMap(),
			apparentByType: new WeakMap(),
			baseConstraintByType: new WeakMap(),
			immediateAliasedBySymbol: new WeakMap(),
			isArrayByType: new WeakMap(),
			returnTypeBySignature: new WeakMap(),
			signatureByNode: new WeakMap(),
			signaturesByType: new WeakMap(),
			typeArgumentsByType: new WeakMap(),
			typeByNode: new WeakMap(),
			typeBySymbol: new WeakMap(),
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

function memoizedNested<Key extends object, SubKey, Value>(
	cache: WeakMap<Key, Map<SubKey, Value>>,
	key: Key,
	subKey: SubKey,
	compute: () => Value,
): Value {
	let values = cache.get(key);
	if (!values) {
		values = new Map();
		cache.set(key, values);
	}
	if (values.has(subKey)) {
		return values.get(subKey) as Value;
	}
	const value = compute();
	values.set(subKey, value);
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

	const prefetchSymbols = (): Map<Node, Symbol | undefined> => {
		const nodes = collectNodes(isSymbolPrefetched);
		const symbols = checker.getSymbolAtLocation(nodes);
		return new Map(nodes.map((node, index) => [node, symbols[index]]));
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

	let expressions: Node[] | undefined;

	const prefetchTypes = (): void => {
		typesPrefetched = true;
		const nodes = (expressions ?? []).filter(
			(node) => !memos.typeByNode.has(node),
		);
		if (!nodes.length) {
			return;
		}
		const types = checker.getTypeAtLocation(nodes);
		for (const [index, node] of nodes.entries()) {
			const type = types[index];
			if (type) {
				memos.typeByNode.set(node, type);
			}
		}
	};

	const shouldPrefetchTypes = (): boolean => {
		if (typeMisses < 2) {
			return false;
		}
		expressions ??= collectNodes(isExpression);
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

	const overrides = {
		getAliasedSymbol: (symbol: Symbol) =>
			memoized(memos.aliasedBySymbol, symbol, () =>
				checker.getAliasedSymbol(symbol),
			),
		getApparentType: (type: Type) =>
			memoized(memos.apparentByType, type, () => checker.getApparentType(type)),
		getBaseConstraintOfType: (type: Type) =>
			memoized(memos.baseConstraintByType, type, () =>
				checker.getBaseConstraintOfType(type),
			),
		getImmediateAliasedSymbol: (symbol: Symbol) =>
			memoized(memos.immediateAliasedBySymbol, symbol, () =>
				checker.getImmediateAliasedSymbol(symbol),
			),
		getPropertyOfType: getTypeProperty,
		getResolvedSignature: (node: Node) =>
			memoized(memos.signatureByNode, node, () =>
				checker.getResolvedSignature(node),
			),
		getReturnTypeOfSignature: (signature: Signature) =>
			memoized(memos.returnTypeBySignature, signature, () =>
				checker.getReturnTypeOfSignature(signature),
			),
		getSignaturesOfType: (type: Type, kind: SignatureKind) =>
			memoizedNested(memos.signaturesByType, type, kind, () =>
				checker.getSignaturesOfType(type, kind),
			),
		getSymbolAtLocation,
		getTypeArguments: (type: TypeReference) =>
			memoized(memos.typeArgumentsByType, type, () =>
				checker.getTypeArguments(type),
			),
		getTypeAtLocation,
		getTypeOfSymbol: (symbol: Symbol) =>
			memoized(memos.typeBySymbol, symbol, () =>
				checker.getTypeOfSymbol(symbol),
			),
		isArrayType: (type: Type) =>
			memoized(memos.isArrayByType, type, () => checker.isArrayType(type)),
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
