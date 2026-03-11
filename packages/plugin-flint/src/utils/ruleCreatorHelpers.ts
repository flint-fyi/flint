import type { AST, Checker } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

export function isLanguageCreateRule(
	node: AST.CallExpression,
	typeChecker: Checker,
): boolean {
	return (
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.name.text === "createRule" &&
		!isRuleCreatorCreateRule(node, typeChecker)
	);
}

function isTypedMethodCall(
	node: AST.CallExpression,
	typeChecker: Checker,
	leftType: string,
	rightCall: string,
): boolean {
	if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
		return false;
	}

	const propertyAccess = node.expression;
	const type = typeChecker.getTypeAtLocation(propertyAccess.expression);
	const typeName = type.getSymbol()?.getName();

	// TODO: Maybe need to check it more strictly
	// https://github.com/flint-fyi/flint/issues/152
	return typeName === leftType && propertyAccess.name.text === rightCall;
}

export const isRuleCreatorCreateRule = (
	node: AST.CallExpression,
	typeChecker: Checker,
) => isTypedMethodCall(node, typeChecker, "RuleCreator", "createRule");

export const isRuleContextReport = (
	node: AST.CallExpression,
	typeChecker: Checker,
) => isTypedMethodCall(node, typeChecker, "RuleContext", "report");
