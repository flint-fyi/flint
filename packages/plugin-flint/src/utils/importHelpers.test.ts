import ts from "typescript";
import { describe, expect, it } from "vitest";

import {
	isImportedBindingFromModule,
	isImportedSpecifierFromModule,
} from "./importHelpers.ts";

function parseAndFind<T extends ts.Node>(
	code: string,
	isMatch: (node: ts.Node) => node is T,
): T {
	const sourceFile = ts.createSourceFile(
		"test.ts",
		code,
		ts.ScriptTarget.Latest,
		true,
	);

	let found: T | undefined;

	function visit(node: ts.Node) {
		if (found) {
			return;
		}

		if (isMatch(node)) {
			found = node;
			return;
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	if (found) {
		return found;
	}

	throw new Error("Expected node was not found in source file.");
}

describe("isImportedBindingFromModule", () => {
	it("returns true for an ImportSpecifier from the matching module", () => {
		const specifier = parseAndFind<ts.ImportSpecifier>(
			`import { foo } from "my-module";`,
			ts.isImportSpecifier,
		);

		expect(isImportedBindingFromModule(specifier, "my-module")).toBe(true);
	});

	it("returns true for a NamespaceImport from the matching module", () => {
		const nsImport = parseAndFind<ts.NamespaceImport>(
			`import * as ns from "my-module";`,
			ts.isNamespaceImport,
		);

		expect(isImportedBindingFromModule(nsImport, "my-module")).toBe(true);
	});

	it("returns false for an ImportSpecifier from a different module", () => {
		const specifier = parseAndFind<ts.ImportSpecifier>(
			`import { foo } from "other-module";`,
			ts.isImportSpecifier,
		);

		expect(isImportedBindingFromModule(specifier, "my-module")).toBe(false);
	});

	it("returns false for a NamespaceImport from a different module", () => {
		const nsImport = parseAndFind<ts.NamespaceImport>(
			`import * as ns from "other-module";`,
			ts.isNamespaceImport,
		);

		expect(isImportedBindingFromModule(nsImport, "my-module")).toBe(false);
	});

	it("returns false for a non-import node", () => {
		const identifier = parseAndFind<ts.Identifier>(
			`const x = 1;`,
			ts.isIdentifier,
		);

		expect(isImportedBindingFromModule(identifier, "my-module")).toBe(false);
	});
});

describe("isImportedSpecifierFromModule", () => {
	it("returns true for a matching named import", () => {
		const specifier = parseAndFind<ts.ImportSpecifier>(
			`import { reportSourceCode } from "@flint.fyi/volar-language";`,
			ts.isImportSpecifier,
		);

		expect(
			isImportedSpecifierFromModule(
				specifier,
				"@flint.fyi/volar-language",
				"reportSourceCode",
			),
		).toBe(true);
	});

	it("returns true for a renamed import matching the original name", () => {
		const specifier = parseAndFind<ts.ImportSpecifier>(
			`import { reportSourceCode as report } from "@flint.fyi/volar-language";`,
			ts.isImportSpecifier,
		);

		expect(
			isImportedSpecifierFromModule(
				specifier,
				"@flint.fyi/volar-language",
				"reportSourceCode",
			),
		).toBe(true);
	});

	it("returns false when the imported name does not match", () => {
		const specifier = parseAndFind<ts.ImportSpecifier>(
			`import { otherFunction } from "@flint.fyi/volar-language";`,
			ts.isImportSpecifier,
		);

		expect(
			isImportedSpecifierFromModule(
				specifier,
				"@flint.fyi/volar-language",
				"reportSourceCode",
			),
		).toBe(false);
	});

	it("returns false when the module does not match", () => {
		const specifier = parseAndFind<ts.ImportSpecifier>(
			`import { reportSourceCode } from "other-module";`,
			ts.isImportSpecifier,
		);

		expect(
			isImportedSpecifierFromModule(
				specifier,
				"@flint.fyi/volar-language",
				"reportSourceCode",
			),
		).toBe(false);
	});

	it("returns false for a NamespaceImport", () => {
		const nsImport = parseAndFind<ts.NamespaceImport>(
			`import * as ns from "@flint.fyi/volar-language";`,
			ts.isNamespaceImport,
		);

		expect(
			isImportedSpecifierFromModule(
				nsImport,
				"@flint.fyi/volar-language",
				"reportSourceCode",
			),
		).toBe(false);
	});
});
