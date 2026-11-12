import { describe, expect, it } from "vitest";

import type { AST } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "@flint.fyi/typescript-language/native/ast";
import { createNativeSourceFile } from "@flint.fyi/typescript-language/test-utils";

import {
	isImportedBindingFromModule,
	isImportedSpecifierFromModule,
} from "./importHelpers.ts";

function parseAndFind<T extends AST.Node>(
	code: string,
	isMatch: (node: AST.Node) => node is T,
): T {
	const sourceFile = createNativeSourceFile(code);

	let found: T | undefined;

	function visit(node: AST.Node): void {
		if (found) {
			return;
		}

		if (isMatch(node)) {
			found = node;
			return;
		}

		node.forEachChild(visit);
	}

	visit(sourceFile);

	if (found) {
		return found;
	}

	throw new Error("Expected node was not found in source file.");
}

describe("isImportedBindingFromModule", () => {
	it("returns true for an ImportSpecifier from the matching module", () => {
		const specifier = parseAndFind<AST.ImportSpecifier>(
			`import { foo } from "my-module";`,
			(node): node is AST.ImportSpecifier =>
				node.kind === SyntaxKind.ImportSpecifier,
		);

		expect(isImportedBindingFromModule(specifier, "my-module")).toBe(true);
	});

	it("returns true for a NamespaceImport from the matching module", () => {
		const nsImport = parseAndFind<AST.NamespaceImport>(
			`import * as ns from "my-module";`,
			(node): node is AST.NamespaceImport =>
				node.kind === SyntaxKind.NamespaceImport,
		);

		expect(isImportedBindingFromModule(nsImport, "my-module")).toBe(true);
	});

	it("returns false for an ImportSpecifier from a different module", () => {
		const specifier = parseAndFind<AST.ImportSpecifier>(
			`import { foo } from "other-module";`,
			(node): node is AST.ImportSpecifier =>
				node.kind === SyntaxKind.ImportSpecifier,
		);

		expect(isImportedBindingFromModule(specifier, "my-module")).toBe(false);
	});

	it("returns false for a NamespaceImport from a different module", () => {
		const nsImport = parseAndFind<AST.NamespaceImport>(
			`import * as ns from "other-module";`,
			(node): node is AST.NamespaceImport =>
				node.kind === SyntaxKind.NamespaceImport,
		);

		expect(isImportedBindingFromModule(nsImport, "my-module")).toBe(false);
	});

	it("returns false for a non-import node", () => {
		const identifier = parseAndFind<AST.Identifier>(
			`const x = 1;`,
			(node): node is AST.Identifier => node.kind === SyntaxKind.Identifier,
		);

		expect(isImportedBindingFromModule(identifier, "my-module")).toBe(false);
	});
});

describe("isImportedSpecifierFromModule", () => {
	it("returns true for a matching named import", () => {
		const specifier = parseAndFind<AST.ImportSpecifier>(
			`import { reportSourceCode } from "@flint.fyi/content-mapper";`,
			(node): node is AST.ImportSpecifier =>
				node.kind === SyntaxKind.ImportSpecifier,
		);

		expect(
			isImportedSpecifierFromModule(
				specifier,
				"@flint.fyi/content-mapper",
				"reportSourceCode",
			),
		).toBe(true);
	});

	it("returns true for a renamed import matching the original name", () => {
		const specifier = parseAndFind<AST.ImportSpecifier>(
			`import { reportSourceCode as report } from "@flint.fyi/content-mapper";`,
			(node): node is AST.ImportSpecifier =>
				node.kind === SyntaxKind.ImportSpecifier,
		);

		expect(
			isImportedSpecifierFromModule(
				specifier,
				"@flint.fyi/content-mapper",
				"reportSourceCode",
			),
		).toBe(true);
	});

	it("returns false when the imported name does not match", () => {
		const specifier = parseAndFind<AST.ImportSpecifier>(
			`import { otherFunction } from "@flint.fyi/content-mapper";`,
			(node): node is AST.ImportSpecifier =>
				node.kind === SyntaxKind.ImportSpecifier,
		);

		expect(
			isImportedSpecifierFromModule(
				specifier,
				"@flint.fyi/content-mapper",
				"reportSourceCode",
			),
		).toBe(false);
	});

	it("returns false when the module does not match", () => {
		const specifier = parseAndFind<AST.ImportSpecifier>(
			`import { reportSourceCode } from "other-module";`,
			(node): node is AST.ImportSpecifier =>
				node.kind === SyntaxKind.ImportSpecifier,
		);

		expect(
			isImportedSpecifierFromModule(
				specifier,
				"@flint.fyi/content-mapper",
				"reportSourceCode",
			),
		).toBe(false);
	});

	it("returns false for a NamespaceImport", () => {
		const nsImport = parseAndFind<AST.NamespaceImport>(
			`import * as ns from "@flint.fyi/content-mapper";`,
			(node): node is AST.NamespaceImport =>
				node.kind === SyntaxKind.NamespaceImport,
		);

		expect(
			isImportedSpecifierFromModule(
				nsImport,
				"@flint.fyi/content-mapper",
				"reportSourceCode",
			),
		).toBe(false);
	});
});
