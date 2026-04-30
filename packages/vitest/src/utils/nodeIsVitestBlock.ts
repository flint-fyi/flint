import type { AST } from "@flint.fyi/typescript-language";
import ts from "typescript";

const knownBlockNames = new Set([
	"afterAll",
	"afterEach",
	"beforeAll",
	"beforeEach",
	"describe",
	"fit",
	"it",
	"test",
	"xdescribe",
	"xit",
	"xit",
	"xtest",
]);

export type VitestBlock = AST.CallExpression & {
	// ...
};

export function nodeIsVitestBlock(node: AST.CallExpression) {
	// TODO: Use a util like getStaticValue
	// https://github.com/flint-fyi/flint/issues/1298
	if (
		node.expression.kind !== ts.SyntaxKind.Identifier ||
		!knownBlockNames.has(node.expression.text)
	) {
		return false;
	}

	// TODO: Use scopes/types to determine whether this actually comes from Vitest
	return true;
}
