import {
	isIdentifier,
	isImportSpecifier,
	isNamespaceImport,
	type Identifier,
	type ImportSpecifier,
	type NamespaceImport,
	type Node,
} from "typescript-native/unstable/ast";
import { describe, expect, it } from "vitest";

import { createNativeSourceFile } from "../../../typescript-language/src/test/createNativeSourceFile.testUtils.ts";
import {
	isImportedBindingFromModule,
	isImportedSpecifierFromModule,
} from "./importHelpers.ts";

function parseAndFind<T extends Node>(
	code: string,
	isMatch: (node: Node) => node is T,
): T {
	const sourceFile = createNativeSourceFile(code);

	let found: T | undefined;

	function visit(node: Node): void {
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
		const specifier = parseAndFind<ImportSpecifier>(
			`import { foo } from "my-module";`,
			isImportSpecifier,
		);

		expect(isImportedBindingFromModule(specifier, "my-module")).toBe(true);
	});

	it("returns true for a NamespaceImport from the matching module", () => {
		const nsImport = parseAndFind<NamespaceImport>(
			`import * as ns from "my-module";`,
			isNamespaceImport,
		);

		expect(isImportedBindingFromModule(nsImport, "my-module")).toBe(true);
	});

	it("returns false for an ImportSpecifier from a different module", () => {
		const specifier = parseAndFind<ImportSpecifier>(
			`import { foo } from "other-module";`,
			isImportSpecifier,
		);

		expect(isImportedBindingFromModule(specifier, "my-module")).toBe(false);
	});

	it("returns false for a NamespaceImport from a different module", () => {
		const nsImport = parseAndFind<NamespaceImport>(
			`import * as ns from "other-module";`,
			isNamespaceImport,
		);

		expect(isImportedBindingFromModule(nsImport, "my-module")).toBe(false);
	});

	it("returns false for a non-import node", () => {
		const identifier = parseAndFind<Identifier>(`const x = 1;`, isIdentifier);

		expect(isImportedBindingFromModule(identifier, "my-module")).toBe(false);
	});
});

describe("isImportedSpecifierFromModule", () => {
	it("returns true for a matching named import", () => {
		const specifier = parseAndFind<ImportSpecifier>(
			`import { reportSourceCode } from "@flint.fyi/volar-language";`,
			isImportSpecifier,
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
		const specifier = parseAndFind<ImportSpecifier>(
			`import { reportSourceCode as report } from "@flint.fyi/volar-language";`,
			isImportSpecifier,
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
		const specifier = parseAndFind<ImportSpecifier>(
			`import { otherFunction } from "@flint.fyi/volar-language";`,
			isImportSpecifier,
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
		const specifier = parseAndFind<ImportSpecifier>(
			`import { reportSourceCode } from "other-module";`,
			isImportSpecifier,
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
		const nsImport = parseAndFind<NamespaceImport>(
			`import * as ns from "@flint.fyi/volar-language";`,
			isNamespaceImport,
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
