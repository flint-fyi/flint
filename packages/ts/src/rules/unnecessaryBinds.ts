import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

// TODO: This will be more clean when there is a scope manager
// https://github.com/flint-fyi/flint/issues/400
function containsThis(node: AST.AnyNode): boolean {
	if (node.kind === SyntaxKind.ThisKeyword) {
		return true;
	}

	if (
		node.kind === SyntaxKind.FunctionExpression ||
		node.kind === SyntaxKind.FunctionDeclaration ||
		node.kind === SyntaxKind.ArrowFunction
	) {
		return false;
	}

	let found = false;
	node.forEachChild((child: AST.Node) => {
		if (containsThis(child)) {
			found = true;
		}
	});
	return found;
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isStaticValue(node: AST.Expression): boolean {
	if (node.kind === SyntaxKind.ParenthesizedExpression) {
		return isStaticValue(node.expression);
	}

	if (node.kind === SyntaxKind.PrefixUnaryExpression) {
		return isStaticValue(node.operand);
	}

	if (node.kind === SyntaxKind.Identifier) {
		return true;
	}

	if (node.kind === SyntaxKind.PropertyAccessExpression) {
		return isStaticValue(node.expression);
	}

	if (node.kind === SyntaxKind.ElementAccessExpression) {
		return (
			isStaticValue(node.expression) && isStaticValue(node.argumentExpression)
		);
	}

	return (
		node.kind === SyntaxKind.ThisKeyword ||
		node.kind === SyntaxKind.SuperKeyword ||
		node.kind === SyntaxKind.TrueKeyword ||
		node.kind === SyntaxKind.FalseKeyword ||
		node.kind === SyntaxKind.NullKeyword ||
		node.kind === SyntaxKind.BigIntLiteral ||
		node.kind === SyntaxKind.NumericLiteral ||
		node.kind === SyntaxKind.StringLiteral ||
		node.kind === SyntaxKind.NoSubstitutionTemplateLiteral ||
		node.kind === SyntaxKind.RegularExpressionLiteral
	);
}

function unwrapParentheses(node: AST.Expression): AST.Expression {
	while (node.kind === SyntaxKind.ParenthesizedExpression) {
		node = node.expression;
	}
	return node;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports unnecessary `.bind()` calls.",
		id: "unnecessaryBinds",
		presets: ["logical"],
	},
	messages: {
		arrowBind: {
			primary: "`.bind()` has no effect on arrow functions.",
			secondary: [
				"Arrow functions have lexical 'this' binding.",
				"Calling .bind() on an arrow function has no effect.",
			],
			suggestions: [
				"Remove the `.bind()` call.",
				"Change the arrow function to a `function` that uses `this`",
			],
		},
		unnecessaryBinds: {
			primary:
				"This `.bind()` call is unnecessary because the function does not use `this`.",
			secondary: [
				"This function does not use `this`.",
				"`.bind()`'s purpose is to bind `this`, so using it on this function doesn't change anything.",
			],
			suggestions: [
				"Remove the `.bind()` call.",
				"Change the function to use `this` if that was intended.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					if (
						node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
						node.expression.name.text !== "bind" ||
						node.arguments.length !== 1
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const boundArgument = node.arguments[0]!;

					// TODO: Use a util like getStaticValue
					// https://github.com/flint-fyi/flint/issues/1298
					const boundFunction = unwrapParentheses(node.expression.expression);
					const fix = isStaticValue(boundArgument)
						? {
								range: getTSNodeRange(node, sourceFile),
								text: node.expression.expression.getText(sourceFile),
							}
						: undefined;

					if (boundFunction.kind === SyntaxKind.ArrowFunction) {
						context.report({
							fix,
							message: "arrowBind",
							range: {
								begin: node.expression.name.getStart(sourceFile),
								end: node.end,
							},
						});
						return;
					}

					if (
						boundFunction.kind === SyntaxKind.FunctionExpression &&
						!containsThis(boundFunction.body)
					) {
						context.report({
							fix,
							message: "unnecessaryBinds",
							range: {
								begin: node.expression.name.getStart(sourceFile),
								end: node.end,
							},
						});
					}
				},
			},
		};
	},
});
