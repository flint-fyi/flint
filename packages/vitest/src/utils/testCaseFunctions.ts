import { SyntaxKind } from "typescript";

import type { AST, ScopeVariable } from "@flint.fyi/typescript-language";

import { parseVitestFunctionCall } from "./parseVitestFunctionCall.ts";

const testCaseFunctionNamesSet = new Set([
	"bench",
	"fit",
	"it",
	"test",
	"xit",
	"xtest",
]);

export const isVitestTestFunction = (node: AST.CallExpression): boolean => {
	const vitestFunction = parseVitestFunctionCall(node);
	return (
		vitestFunction != null && testCaseFunctionNamesSet.has(vitestFunction.name)
	);
};

export const getTestCallExpressionsFromDeclaredVariables = (
	declaredVariables: readonly ScopeVariable[],
): AST.CallExpression[] => {
	return declaredVariables.reduce<AST.CallExpression[]>(
		(acc, { references }) =>
			acc.concat(
				references
					.map(({ identifier }) => identifier.parent)
					.filter(
						(node): node is AST.CallExpression =>
							node.kind === SyntaxKind.CallExpression &&
							isVitestTestFunction(node),
					),
			),
		[],
	);
};
