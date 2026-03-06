import type { AST } from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

export function isLanguageCreateRule(
	node: AST.CallExpression,
	typeChecker: ts.TypeChecker,
): boolean {
	return (
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.name.text === "createRule" &&
		!isRuleCreatorCreateRule(node, typeChecker)
	);
}

// TODO: Maybe need to check it more strictly
// https://github.com/flint-fyi/flint/issues/152
export function isRuleCreatorCreateRule(
	node: AST.CallExpression,
	typeChecker: ts.TypeChecker,
): boolean {
	if (
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.name.text === "createRule"
	) {
		const propertyAccess = node.expression;
		const type = typeChecker.getTypeAtLocation(propertyAccess.expression);

		return type.getSymbol()?.getName() === "RuleCreator";
	}
	return false;
}

// TODO: Maybe need to check it more strictly
// https://github.com/flint-fyi/flint/issues/152
export function isRuleContextReport(
	node: AST.CallExpression,
	typeChecker: ts.TypeChecker,
): boolean {
	if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
		return false;
	}

	const propertyAccess = node.expression;
	const type = typeChecker.getTypeAtLocation(propertyAccess.expression);
	const typeName = type.getSymbol()?.getName();

	return typeName === "RuleContext" && propertyAccess.name.text === "report";
}
