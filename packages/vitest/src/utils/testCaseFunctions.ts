import { isCallExpression } from "typescript-native/unstable/ast";

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
							isCallExpression(node) && isVitestTestFunction(node),
					),
			),
		[],
	);
};
