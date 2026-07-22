import { SyntaxKind } from "typescript";

import { typescriptLanguage, type AST } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports inconsistent types when spreading a ternary in an array literal.",
		id: "arrayTernarySpreadingConsistency",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		inconsistentTypes: {
			primary:
				"Prefer consistent types in both branches when spreading a ternary in an array.",
			secondary: [
				"Mixing array and string types in ternary spread branches reduces code clarity.",
				"Both branches should use the same type: either arrays or strings.",
			],
			suggestions: ["Replace the empty string with an empty array."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ArrayLiteralExpression: (node, { sourceFile }) => {
					for (const element of node.elements) {
						if (
							element.kind !== SyntaxKind.SpreadElement ||
							element.expression.kind !== SyntaxKind.ParenthesizedExpression
						) {
							continue;
						}

						const inner = element.expression.expression;
						if (inner.kind !== SyntaxKind.ConditionalExpression) {
							continue;
						}

						const whenTrue = unwrapParentheses(inner.whenTrue);
						const whenFalse = unwrapParentheses(inner.whenFalse);

						if (
							whenTrue.kind === SyntaxKind.ArrayLiteralExpression &&
							isStringLike(whenFalse) &&
							isEmptyStringLike(whenFalse)
						) {
							context.report({
								fix: {
									range: {
										begin: whenFalse.getStart(sourceFile),
										end: whenFalse.getEnd(),
									},
									text: "[]",
								},
								message: "inconsistentTypes",
								range: {
									begin: whenFalse.getStart(sourceFile),
									end: whenFalse.getEnd(),
								},
							});
							continue;
						}

						if (
							isStringLike(whenTrue) &&
							whenFalse.kind === SyntaxKind.ArrayLiteralExpression &&
							isEmptyArray(whenFalse)
						) {
							context.report({
								fix: {
									range: {
										begin: whenFalse.getStart(sourceFile),
										end: whenFalse.getEnd(),
									},
									text: "''",
								},
								message: "inconsistentTypes",
								range: {
									begin: whenFalse.getStart(sourceFile),
									end: whenFalse.getEnd(),
								},
							});
						}
					}
				},
			},
		};
	},
});

function isEmptyArray(node: AST.Expression) {
	return (
		node.kind === SyntaxKind.ArrayLiteralExpression && !node.elements.length
	);
}

function isEmptyStringLike(node: AST.Expression) {
	return isStringLike(node) && node.text === "";
}

function isStringLike(node: AST.Expression) {
	return (
		node.kind === SyntaxKind.StringLiteral ||
		node.kind === SyntaxKind.NoSubstitutionTemplateLiteral
	);
}

function unwrapParentheses(node: AST.Expression): AST.Expression {
	return node.kind === SyntaxKind.ParenthesizedExpression
		? unwrapParentheses(node.expression)
		: node;
}
