import { SyntaxKind } from "typescript-native/unstable/ast";
import type { Checker } from "typescript-native/unstable/sync";
import { describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";

import {
	createCachedChecker,
	type BatchRequests,
} from "./createCachedChecker.ts";
import { createTypeScriptProjectSession } from "./createTypeScriptProjectSession.ts";
import type * as AST from "./types/ast.ts";
import { forEachChild } from "./utils/forEachChild.ts";

const configFilePath = "/repo/tsconfig.json";
const indexFilePath = "/repo/src/index.ts";
const libFilePath = "/repo/src/lib.d.ts";
const otherFilePath = "/repo/src/other.ts";

function collectNodes(
	sourceFile: AST.SourceFile,
	kinds: SyntaxKind[],
): AST.AnyNode[] {
	const nodes: AST.AnyNode[] = [];
	const visit = (node: AST.AnyNode): undefined => {
		if (kinds.includes(node.kind)) {
			nodes.push(node);
		}
		forEachChild(node, visit);
	};
	forEachChild(sourceFile, visit);
	return nodes;
}

// Identifiers that refer to something, rather than naming a declaration.
function collectReferences(sourceFile: AST.SourceFile): AST.AnyNode[] {
	return collectNodes(sourceFile, [SyntaxKind.Identifier]).filter(
		(node) =>
			node.parent.kind !== SyntaxKind.ImportSpecifier &&
			!("name" in node.parent && node.parent.name === node),
	);
}

function createFixture() {
	const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
	host.vfsUpsertFile(
		configFilePath,
		JSON.stringify({
			compilerOptions: { noLib: true, strict: true },
			include: ["src"],
		}),
	);
	host.vfsUpsertFile(otherFilePath, "export const other = { value: 1 };");
	host.vfsUpsertFile(
		libFilePath,
		`interface Array<T> { length: number; [index: number]: T }
interface Boolean {}
interface CallableFunction {}
interface Function {}
interface IArguments {}
interface NewableFunction {}
interface Number {}
interface Object {}
interface RegExp {}
interface String {}
`,
	);
	host.vfsUpsertFile(
		indexFilePath,
		`import { other } from "./other.ts";
export const index = other.value;
export const sum = index + other.value;
export const doubled = () => sum * 2;
export const call = doubled();
export const greet = (name: string, count: number) => name.repeat(count);
export const greeting = greet("hi", 2);
export const values = [index, sum];
/** @deprecated Use something else. */
export const legacy = 1;
export const usesLegacy = legacy;
`,
	);
	const session = createTypeScriptProjectSession(host);
	session.update({ openFiles: [indexFilePath, otherFilePath] });
	const project = session.getProjectForFile(indexFilePath);
	if (!project) {
		throw new Error("Expected a project for the index file.");
	}
	const getSourceFile = (filePath: string) => {
		const sourceFile = project.program.getSourceFile(filePath);
		if (!sourceFile) {
			throw new Error(`Expected a source file for ${filePath}.`);
		}
		return sourceFile as AST.SourceFile;
	};
	// The checker's methods are lazily defined getters, which `vi.spyOn`
	// cannot replace, so observe calls through an inheriting object instead.
	const observe = <Name extends keyof Checker>(name: Name) => {
		const method = project.checker[name];
		return Object.assign(vi.fn(method), {
			gen: (method as { gen?: unknown }).gen,
		});
	};
	const spy = observe("getSymbolAtLocation");
	const typeSpy = observe("getTypeAtLocation");
	const signatureSpy = observe("getResolvedSignature");
	const spies = {
		getAliasedSymbol: observe("getAliasedSymbol"),
		getApparentType: observe("getApparentType"),
		getBaseConstraintOfType: observe("getBaseConstraintOfType"),
		getImmediateAliasedSymbol: observe("getImmediateAliasedSymbol"),
		getJsDocTagsOfSymbol: observe("getJsDocTagsOfSymbol"),
		getTypeOfSymbol: observe("getTypeOfSymbol"),
		isArrayType: observe("isArrayType"),
	};
	const checker = Object.create(project.checker, {
		...Object.fromEntries(
			Object.entries(spies).map(([name, value]) => [name, { value }]),
		),
		getResolvedSignature: { value: signatureSpy },
		getSymbolAtLocation: { value: spy },
		getTypeAtLocation: { value: typeSpy },
	}) as Checker;
	const batchSpy = vi.fn();
	const batch: BatchRequests = (generators) => {
		batchSpy();
		return session.batch(generators);
	};
	return {
		batch,
		batchSpy,
		checker,
		indexFile: getSourceFile(indexFilePath),
		otherFile: getSourceFile(otherFilePath),
		signatureSpy,
		spies,
		spy,
		[Symbol.dispose]: () => {
			session[Symbol.dispose]();
		},
		typeSpy,
	};
}

describe(createCachedChecker, () => {
	it("answers identifier lookups with the same symbols as the checker, from one request", () => {
		using fixture = createFixture();
		const { checker, indexFile, spy } = fixture;
		const prefetching = createCachedChecker(checker, indexFile);
		const identifiers = collectReferences(indexFile);

		expect(identifiers.length).toBeGreaterThan(3);

		const expected = identifiers.map((node) =>
			checker.getSymbolAtLocation(node),
		);
		spy.mockClear();

		const actual = identifiers.map((node) =>
			prefetching.getSymbolAtLocation(node),
		);

		expect(actual).toEqual(expected);
		expect(expected.some((symbol) => symbol !== undefined)).toBe(true);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0]?.[0]).toBeInstanceOf(Array);
	});

	it("prefetches property accesses and module specifiers too", () => {
		using fixture = createFixture();
		const { checker, indexFile, spy } = fixture;
		const prefetching = createCachedChecker(checker, indexFile);
		const [propertyAccess] = collectNodes(indexFile, [
			SyntaxKind.PropertyAccessExpression,
		]);
		const [moduleSpecifier] = collectNodes(indexFile, [
			SyntaxKind.StringLiteral,
		]);

		expect(
			prefetching.getSymbolAtLocation(
				nullThrows(propertyAccess, "Expected a property access."),
			)?.name,
		).toBe("value");
		expect(
			prefetching.getSymbolAtLocation(
				nullThrows(moduleSpecifier, "Expected a module specifier."),
			)?.name,
		).toBe('"/repo/src/other"');
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it("does not fetch anything until a symbol is requested", () => {
		using fixture = createFixture();
		const { checker, indexFile, spy } = fixture;

		const prefetching = createCachedChecker(checker, indexFile);
		prefetching.getTypeAtLocation(
			nullThrows(
				collectNodes(indexFile, [SyntaxKind.Identifier])[0],
				"Expected an identifier.",
			),
		);

		expect(spy).not.toHaveBeenCalled();
	});

	it("passes nodes from other files and array lookups through", () => {
		using fixture = createFixture();
		const { checker, indexFile, otherFile, spy } = fixture;
		const prefetching = createCachedChecker(checker, indexFile);
		const otherIdentifiers = collectNodes(otherFile, [SyntaxKind.Identifier]);
		const otherIdentifier = nullThrows(
			otherIdentifiers[0],
			"Expected an identifier.",
		);

		expect(prefetching.getSymbolAtLocation(otherIdentifier)?.name).toBe(
			"other",
		);
		expect(spy).toHaveBeenCalledExactlyOnceWith(otherIdentifier);

		spy.mockClear();
		prefetching.getSymbolAtLocation(otherIdentifiers);

		expect(spy).toHaveBeenCalledExactlyOnceWith(otherIdentifiers);
	});

	it("answers repeated type lookups from memory, then fetches a small file's expressions at once", () => {
		using fixture = createFixture();
		const { checker, indexFile, typeSpy } = fixture;
		const cached = createCachedChecker(checker, indexFile);
		const identifiers = collectReferences(indexFile);
		const [first, second] = identifiers;
		const firstIdentifier = nullThrows(first, "Expected an identifier.");
		const secondIdentifier = nullThrows(second, "Expected an identifier.");

		const firstType = cached.getTypeAtLocation(firstIdentifier);

		expect(cached.getTypeAtLocation(firstIdentifier)).toBe(firstType);
		expect(typeSpy).toHaveBeenCalledExactlyOnceWith(firstIdentifier);

		// The second miss in a small file fetches the rest in one request.
		cached.getTypeAtLocation(secondIdentifier);

		expect(typeSpy).toHaveBeenCalledTimes(2);
		expect(typeSpy.mock.calls[1]?.[0]).toBeInstanceOf(Array);

		typeSpy.mockClear();
		const expected = identifiers.map((node) => checker.getTypeAtLocation(node));
		typeSpy.mockClear();

		expect(identifiers.map((node) => cached.getTypeAtLocation(node))).toEqual(
			expected,
		);
		expect(typeSpy).not.toHaveBeenCalled();
	});

	it("shares memoized answers between wrappers of the same checker", () => {
		using fixture = createFixture();
		const { checker, indexFile, otherFile, signatureSpy } = fixture;
		const [call] = collectNodes(indexFile, [SyntaxKind.CallExpression]);
		const callExpression = nullThrows(call, "Expected a call expression.");
		const forIndex = createCachedChecker(checker, indexFile);
		const forOther = createCachedChecker(checker, otherFile);

		const signature = forIndex.getResolvedSignature(callExpression);

		expect(forOther.getResolvedSignature(callExpression)).toBe(signature);
		expect(signatureSpy).toHaveBeenCalledExactlyOnceWith(callExpression);
	});

	it("leaves every other checker method intact", () => {
		using fixture = createFixture();
		const { checker, indexFile } = fixture;
		const prefetching = createCachedChecker(checker, indexFile);
		const [identifier] = collectNodes(indexFile, [SyntaxKind.Identifier]);
		const symbol = nullThrows(
			prefetching.getSymbolAtLocation(
				nullThrows(identifier, "Expected an identifier."),
			),
			"Expected a symbol.",
		);

		expect(prefetching.getTypeOfSymbol(symbol)).toBe(
			checker.getTypeOfSymbol(symbol),
		);
		expect(symbol.getJsDocTags(prefetching)).toEqual([]);
	});
	it("looks up a declaration's name alone when it is asked about", () => {
		using fixture = createFixture();
		const { checker, indexFile, spy } = fixture;
		const cached = createCachedChecker(checker, indexFile);
		const declarationName = nullThrows(
			collectNodes(indexFile, [SyntaxKind.Identifier]).find(
				(node) => node.parent.kind === SyntaxKind.VariableDeclaration,
			),
			"Expected a variable declaration name.",
		);

		expect(cached.getSymbolAtLocation(declarationName)?.name).toBe("index");
		expect(spy).toHaveBeenCalledExactlyOnceWith(declarationName);
	});

	it("answers JSDoc tags for a file's symbols from one batch when a rule asks for one", () => {
		using fixture = createFixture();
		const { batch, batchSpy, checker, indexFile, spies } = fixture;
		const cached = createCachedChecker(checker, indexFile, batch);
		const symbols = collectReferences(indexFile)
			.map((node) => cached.getSymbolAtLocation(node))
			.filter((symbol) => symbol !== undefined);
		const expected = symbols.map((symbol) =>
			checker.getJsDocTagsOfSymbol(symbol),
		);
		spies.getJsDocTagsOfSymbol.mockClear();

		expect(symbols.map((symbol) => symbol.getJsDocTags(cached))).toEqual(
			expected,
		);
		expect(expected.flat().map(({ name }) => name)).toContain("deprecated");
		expect(spies.getJsDocTagsOfSymbol).not.toHaveBeenCalled();
		expect(batchSpy).toHaveBeenCalledOnce();
	});

	it("resolves a file's imports from one batch when a rule resolves one", () => {
		using fixture = createFixture();
		const { batch, batchSpy, checker, indexFile, spies } = fixture;
		const cached = createCachedChecker(checker, indexFile, batch);
		const importName = nullThrows(
			collectNodes(indexFile, [SyntaxKind.Identifier])[0],
			"Expected the imported name.",
		);
		const alias = nullThrows(
			cached.getSymbolAtLocation(importName),
			"Expected an alias symbol.",
		);

		expect(cached.getAliasedSymbol(alias)).toBe(
			checker.getAliasedSymbol(alias),
		);
		expect(cached.getImmediateAliasedSymbol(alias)).toBe(
			checker.getImmediateAliasedSymbol(alias),
		);
		expect(spies.getAliasedSymbol).toHaveBeenCalledOnce();
		expect(spies.getImmediateAliasedSymbol).toHaveBeenCalledOnce();
		expect(batchSpy).toHaveBeenCalledOnce();
	});

	it("resolves a file's call signatures and their parameter types in batches when a rule resolves one", () => {
		using fixture = createFixture();
		const { batch, batchSpy, checker, indexFile, signatureSpy, spies } =
			fixture;
		const cached = createCachedChecker(checker, indexFile, batch);
		const calls = collectNodes(indexFile, [SyntaxKind.CallExpression]);
		const signatures = calls.map((call) => cached.getResolvedSignature(call));

		expect(signatureSpy).not.toHaveBeenCalled();

		const parameters = signatures.flatMap((signature) =>
			signature.getParameters(),
		);

		expect(parameters.map(({ name }) => name)).toContain("count");
		expect(
			parameters.map((parameter) =>
				checker.typeToString(cached.getTypeOfSymbol(parameter)),
			),
		).toEqual(
			parameters.map((parameter) =>
				checker.typeToString(checker.getTypeOfSymbol(parameter)),
			),
		);
		expect(spies.getTypeOfSymbol).toHaveBeenCalledTimes(parameters.length);
		expect(batchSpy).toHaveBeenCalledTimes(3);
	});

	it("answers apparent types, base constraints, and array checks from type flags when it can", () => {
		using fixture = createFixture();
		const { checker, indexFile, spies } = fixture;
		const cached = createCachedChecker(checker, indexFile);
		const typeOfFirst = (sourceFile: AST.SourceFile, kind: SyntaxKind) =>
			checker.getTypeAtLocation(
				nullThrows(
					collectNodes(sourceFile, [kind])[0],
					`Expected a ${SyntaxKind[kind]}.`,
				),
			);
		const arrayType = typeOfFirst(indexFile, SyntaxKind.ArrayLiteralExpression);
		const literalType = typeOfFirst(indexFile, SyntaxKind.NumericLiteral);
		const objectType = typeOfFirst(
			fixture.otherFile,
			SyntaxKind.ObjectLiteralExpression,
		);

		expect(cached.getApparentType(objectType)).toBe(objectType);
		expect(cached.getApparentType(literalType)).toBe(
			cached.getApparentType(checker.getNumberType()),
		);
		expect(spies.getApparentType).toHaveBeenCalledOnce();

		expect(cached.getBaseConstraintOfType(objectType)).toBeUndefined();
		expect(spies.getBaseConstraintOfType).not.toHaveBeenCalled();

		expect(cached.isArrayType(objectType)).toBe(false);
		expect(cached.isArrayType(arrayType)).toBe(true);
		expect(cached.isArrayType(arrayType)).toBe(true);
		expect(spies.isArrayType).toHaveBeenCalledOnce();
	});
});
