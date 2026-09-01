import { SyntaxKind } from "typescript-native/unstable/ast";
import { API, JsxEmit } from "typescript-native/unstable/sync";
import { describe, expect, it } from "vitest";

import type { AST } from "@flint.fyi/typescript-language";

import { getFunctionName } from "./getFunctionName.ts";

const files = new Map<string, string>();
const api = new API({
	cwd: "/repo",
	fs: {
		fileExists: (fileName) => files.has(fileName),
		readFile: (fileName) => files.get(fileName) ?? null,
	},
});
let fileIndex = 0;

function createNativeSourceFile(sourceText: string): AST.SourceFile {
	const fileName = `/repo/test-${String(fileIndex++)}.ts`;
	files.set(fileName, sourceText);
	const program = api.createProgram([fileName], {
		compilerOptions: { jsx: JsxEmit.Preserve, noLib: true },
	});
	const sourceFile = program.getSourceFile(fileName);
	if (!sourceFile) {
		throw new Error(`Expected native program to contain ${fileName}.`);
	}
	return sourceFile as unknown as AST.SourceFile;
}

function findFirstNode(sourceText: string, kind: SyntaxKind): AST.Node {
	const sourceFile = createNativeSourceFile(sourceText);

	let foundNode: AST.Node | undefined;
	const visit = (node: AST.Node): void => {
		if (node.kind === kind) {
			foundNode = node;
			return;
		}

		node.forEachChild(visit);
	};

	visit(sourceFile);

	if (!foundNode) {
		throw new Error(`Could not find node with kind ${kind}`);
	}

	return foundNode;
}

describe(getFunctionName, () => {
	it("should return the variable name for arrow functions assigned to identifiers", () => {
		const arrowFunction = findFirstNode(
			"const value = () => {};",
			SyntaxKind.ArrowFunction,
		) as AST.ArrowFunction;

		expect(getFunctionName(arrowFunction)).toBe("value");
	});

	it("should return undefined for arrow functions not assigned to a variable declaration", () => {
		const arrowFunction = findFirstNode(
			"const object = { method: () => {} };",
			SyntaxKind.ArrowFunction,
		) as AST.ArrowFunction;

		expect(getFunctionName(arrowFunction)).toBeUndefined();
	});

	it("should return the name for function declarations", () => {
		const functionDeclaration = findFirstNode(
			"function named() {}",
			SyntaxKind.FunctionDeclaration,
		) as AST.FunctionDeclaration;

		expect(getFunctionName(functionDeclaration)).toBe("named");
	});

	it("should return undefined for anonymous function declarations", () => {
		const functionDeclaration = findFirstNode(
			"export default function () {}",
			SyntaxKind.FunctionDeclaration,
		) as AST.FunctionDeclaration;

		expect(getFunctionName(functionDeclaration)).toBeUndefined();
	});

	it("should return the name for function expressions", () => {
		const functionExpression = findFirstNode(
			"const value = function named() {};",
			SyntaxKind.FunctionExpression,
		) as AST.FunctionExpression;

		expect(getFunctionName(functionExpression)).toBe("named");
	});

	it("should return undefined for anonymous function expressions", () => {
		const functionExpression = findFirstNode(
			"const value = function () {};",
			SyntaxKind.FunctionExpression,
		) as AST.FunctionExpression;

		expect(getFunctionName(functionExpression)).toBeUndefined();
	});

	it("should return the name for method declarations", () => {
		const methodDeclaration = findFirstNode(
			"class Example { method() {} }",
			SyntaxKind.MethodDeclaration,
		) as AST.MethodDeclaration;

		expect(getFunctionName(methodDeclaration)).toBe("method");
	});

	it("should return undefined for computed method declarations", () => {
		const methodDeclaration = findFirstNode(
			"class Example { ['method']() {} }",
			SyntaxKind.MethodDeclaration,
		) as AST.MethodDeclaration;

		expect(getFunctionName(methodDeclaration)).toBeUndefined();
	});

	it("should return the name for method signatures", () => {
		const methodSignature = findFirstNode(
			"interface Example { method(): void; }",
			SyntaxKind.MethodSignature,
		) as AST.MethodSignature;

		expect(getFunctionName(methodSignature)).toBe("method");
	});

	it("should return undefined for string-literal method signatures", () => {
		const methodSignature = findFirstNode(
			'interface Example { "method"(): void; }',
			SyntaxKind.MethodSignature,
		) as AST.MethodSignature;

		expect(getFunctionName(methodSignature)).toBeUndefined();
	});

	it("should return undefined for unknown type", () => {
		const methodSignature = findFirstNode(
			"const value = () => {};",
			SyntaxKind.Identifier,
		);

		// @ts-expect-error -- testing bad input
		expect(getFunctionName(methodSignature)).toBeUndefined();
	});
});
