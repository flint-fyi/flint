import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

// TODO: This will be more clean when there is a scope manager
// https://github.com/flint-fyi/flint/issues/400
function containsThis(node: ts.Node): boolean {
	if (node.kind === ts.SyntaxKind.ThisKeyword) {
		return true;
	}

	if (
		ts.isFunctionExpression(node) ||
		ts.isFunctionDeclaration(node) ||
		ts.isArrowFunction(node)
	) {
		return false;
	}

	let found = false;
	node.forEachChild((child) => {
		if (containsThis(child)) {
			found = true;
		}
	});
	return found;
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isStaticValue(node: ts.Expression): boolean {
	if (ts.isParenthesizedExpression(node)) {
		return isStaticValue(node.expression);
	}

	if (ts.isPrefixUnaryExpression(node)) {
		return isStaticValue(node.operand);
	}

	if (ts.isIdentifier(node)) {
		return true;
	}

	if (ts.isPropertyAccessExpression(node)) {
		return isStaticValue(node.expression);
	}

	if (ts.isElementAccessExpression(node)) {
		return (
			isStaticValue(node.expression) && isStaticValue(node.argumentExpression)
		);
	}

	return (
		node.kind === ts.SyntaxKind.ThisKeyword ||
		node.kind === ts.SyntaxKind.SuperKeyword ||
		node.kind === ts.SyntaxKind.TrueKeyword ||
		node.kind === ts.SyntaxKind.FalseKeyword ||
		node.kind === ts.SyntaxKind.NullKeyword ||
		ts.isBigIntLiteral(node) ||
		ts.isNumericLiteral(node) ||
		ts.isStringLiteral(node) ||
		ts.isNoSubstitutionTemplateLiteral(node) ||
		node.kind === ts.SyntaxKind.RegularExpressionLiteral
	);
}

function unwrapParentheses(node: ts.Expression): ts.Expression {
	while (ts.isParenthesizedExpression(node)) {
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
						!ts.isPropertyAccessExpression(node.expression) ||
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

					if (ts.isArrowFunction(boundFunction)) {
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
						ts.isFunctionExpression(boundFunction) &&
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
