import { SyntaxKind } from "typescript-native/ast";
import { describe, expect, it } from "vitest";

import { createNativeSourceFile } from "../test/createNativeSourceFile.testUtils.ts";
import type * as AST from "../types/ast.ts";
import { forEachChild } from "./forEachChild.ts";
import { getAuthoredNode } from "./getAuthoredNode.ts";

function collectKinds(sourceFile: AST.SourceFile): string[] {
	const kinds: string[] = [];
	const collect = (node: AST.AnyNode): undefined => {
		kinds.push(SyntaxKind[node.kind]);
		forEachChild(node, collect);
	};
	forEachChild(sourceFile, collect);
	return kinds;
}

describe(getAuthoredNode, () => {
	it("returns undefined when the node was reparsed from a JSDoc tag", () => {
		const sourceFile = createNativeSourceFile(
			"/** @typedef {string} Text */\nexport {};",
			".js",
		);

		const statement = sourceFile.statements[0];

		expect(statement?.kind).toBe(SyntaxKind.JSTypeAliasDeclaration);
		expect(statement && getAuthoredNode(statement)).toBeUndefined();
	});

	it("returns the wrapped expression when the node is a JSDoc cast", () => {
		const sourceFile = createNativeSourceFile(
			"/** @type {unknown} */ (value);",
			".js",
		);
		const statement = sourceFile.statements[0] as AST.ExpressionStatement;
		const parenthesized = statement.expression as AST.ParenthesizedExpression;

		expect(parenthesized.expression.kind).toBe(SyntaxKind.AsExpression);
		expect(getAuthoredNode(parenthesized.expression)?.kind).toBe(
			SyntaxKind.Identifier,
		);
	});

	it("returns the same node when the node is an authored cast", () => {
		const sourceFile = createNativeSourceFile("value as unknown;");
		const statement = sourceFile.statements[0] as AST.ExpressionStatement;

		expect(getAuthoredNode(statement.expression)).toBe(statement.expression);
	});
});

describe(forEachChild, () => {
	it("skips JSDoc type annotations when the file is JavaScript", () => {
		const sourceFile = createNativeSourceFile(
			[
				"/** @typedef {string} Text */",
				"/**",
				" * @param {Text} text",
				" * @returns {number}",
				" */",
				"function measure(text) {",
				"\treturn /** @type {number} */ (text.length);",
				"}",
			].join("\n"),
			".js",
		);

		expect(collectKinds(sourceFile)).toEqual([
			"FunctionDeclaration",
			"Identifier",
			"Parameter",
			"Identifier",
			"Block",
			"ReturnStatement",
			"ParenthesizedExpression",
			"PropertyAccessExpression",
			"Identifier",
			"Identifier",
			"EndOfFile",
		]);
	});

	it("visits type annotations when the file is TypeScript", () => {
		const sourceFile = createNativeSourceFile("let value: string;");

		expect(collectKinds(sourceFile)).toContain("StringKeyword");
	});
});
