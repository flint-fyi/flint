import {
	SyntaxKind,
	type Identifier,
	type ImportSpecifier,
	type NamespaceImport,
	type Node,
} from "typescript-native/unstable/ast";
import { API, JsxEmit } from "typescript-native/unstable/sync";
import { describe, expect, it } from "vitest";

import {
	isImportedBindingFromModule,
	isImportedSpecifierFromModule,
} from "./importHelpers.ts";

const files = new Map<string, string>();
const api = new API({
	cwd: "/repo",
	fs: {
		fileExists: (fileName) => files.has(fileName),
		readFile: (fileName) => files.get(fileName) ?? null,
	},
});
let fileIndex = 0;

function createNativeSourceFile(sourceText: string) {
	const fileName = `/repo/test-${String(fileIndex++)}.ts`;
	files.set(fileName, sourceText);
	const program = api.createProgram([fileName], {
		compilerOptions: { jsx: JsxEmit.Preserve, noLib: true },
	});
	const sourceFile = program.getSourceFile(fileName);
	if (!sourceFile) {
		throw new Error(`Expected native program to contain ${fileName}.`);
	}
	return sourceFile;
}

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
			(node): node is ImportSpecifier =>
				node.kind === SyntaxKind.ImportSpecifier,
		);

		expect(isImportedBindingFromModule(specifier, "my-module")).toBe(true);
	});

	it("returns true for a NamespaceImport from the matching module", () => {
		const nsImport = parseAndFind<NamespaceImport>(
			`import * as ns from "my-module";`,
			(node): node is NamespaceImport =>
				node.kind === SyntaxKind.NamespaceImport,
		);

		expect(isImportedBindingFromModule(nsImport, "my-module")).toBe(true);
	});

	it("returns false for an ImportSpecifier from a different module", () => {
		const specifier = parseAndFind<ImportSpecifier>(
			`import { foo } from "other-module";`,
			(node): node is ImportSpecifier =>
				node.kind === SyntaxKind.ImportSpecifier,
		);

		expect(isImportedBindingFromModule(specifier, "my-module")).toBe(false);
	});

	it("returns false for a NamespaceImport from a different module", () => {
		const nsImport = parseAndFind<NamespaceImport>(
			`import * as ns from "other-module";`,
			(node): node is NamespaceImport =>
				node.kind === SyntaxKind.NamespaceImport,
		);

		expect(isImportedBindingFromModule(nsImport, "my-module")).toBe(false);
	});

	it("returns false for a non-import node", () => {
		const identifier = parseAndFind<Identifier>(
			`const x = 1;`,
			(node): node is Identifier => node.kind === SyntaxKind.Identifier,
		);

		expect(isImportedBindingFromModule(identifier, "my-module")).toBe(false);
	});
});

describe("isImportedSpecifierFromModule", () => {
	it("returns true for a matching named import", () => {
		const specifier = parseAndFind<ImportSpecifier>(
			`import { reportSourceCode } from "@flint.fyi/volar-language";`,
			(node): node is ImportSpecifier =>
				node.kind === SyntaxKind.ImportSpecifier,
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
			(node): node is ImportSpecifier =>
				node.kind === SyntaxKind.ImportSpecifier,
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
			(node): node is ImportSpecifier =>
				node.kind === SyntaxKind.ImportSpecifier,
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
			(node): node is ImportSpecifier =>
				node.kind === SyntaxKind.ImportSpecifier,
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
			(node): node is NamespaceImport =>
				node.kind === SyntaxKind.NamespaceImport,
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
