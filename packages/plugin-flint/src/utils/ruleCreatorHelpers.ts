import { SyntaxKind } from "typescript-native/unstable/ast";

import type { AST, Checker } from "@flint.fyi/typescript-language";

export function isLanguageCreateRule(
	node: AST.CallExpression,
	checker: Checker,
): boolean {
	return (
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.name.text === "createRule" &&
		!isRuleCreatorCreateRule(node, checker)
	);
}

function isTypedMethodCall(
	node: AST.CallExpression,
	checker: Checker,
	leftType: string,
	rightCall: string,
): boolean {
	if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
		return false;
	}

	const propertyAccess = node.expression;
	const type = checker.getTypeAtLocation(propertyAccess.expression);
	const typeName = type.getSymbol()?.name;

	// TODO: Maybe need to check it more strictly
	// https://github.com/flint-fyi/flint/issues/152
	return typeName === leftType && propertyAccess.name.text === rightCall;
}

export const isRuleCreatorCreateRule = (
	node: AST.CallExpression,
	checker: Checker,
): boolean => isTypedMethodCall(node, checker, "RuleCreator", "createRule");

export const isRuleContextReport = (
	node: AST.CallExpression,
	checker: Checker,
): boolean => isTypedMethodCall(node, checker, "RuleContext", "report");
