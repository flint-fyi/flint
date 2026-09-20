import { SyntaxKind } from "typescript-native/unstable/ast";
import type { Checker } from "typescript-native/unstable/sync";
import { describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";

import { createPrefetchingChecker } from "./createPrefetchingChecker.ts";
import { createTypeScriptProjectSession } from "./createTypeScriptProjectSession.ts";
import type * as AST from "./types/ast.ts";
import { forEachChild } from "./utils/forEachChild.ts";

const configFilePath = "/repo/tsconfig.json";
const indexFilePath = "/repo/src/index.ts";
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
		indexFilePath,
		`import { other } from "./other.ts";
export const index = other.value;
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
	const spy = vi.fn(project.checker.getSymbolAtLocation);
	const checker = Object.create(project.checker, {
		getSymbolAtLocation: {
			value: Object.assign(spy, {
				// eslint-disable-next-line @typescript-eslint/unbound-method
				gen: project.checker.getSymbolAtLocation.gen,
			}),
		},
	}) as Checker;
	return {
		checker,
		indexFile: getSourceFile(indexFilePath),
		otherFile: getSourceFile(otherFilePath),
		spy,
		[Symbol.dispose]: () => {
			session[Symbol.dispose]();
		},
	};
}

describe(createPrefetchingChecker, () => {
	it("answers identifier lookups with the same symbols as the checker, from one request", () => {
		using fixture = createFixture();
		const { checker, indexFile, spy } = fixture;
		const prefetching = createPrefetchingChecker(checker, indexFile);
		const identifiers = collectNodes(indexFile, [SyntaxKind.Identifier]);

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
		const prefetching = createPrefetchingChecker(checker, indexFile);
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

		const prefetching = createPrefetchingChecker(checker, indexFile);
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
		const prefetching = createPrefetchingChecker(checker, indexFile);
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

	it("leaves every other checker method intact", () => {
		using fixture = createFixture();
		const { checker, indexFile } = fixture;
		const prefetching = createPrefetchingChecker(checker, indexFile);
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
});
