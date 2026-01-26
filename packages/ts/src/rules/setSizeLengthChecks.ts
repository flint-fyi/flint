import {
	type AST,
	type Checker,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isNewSetExpression(expression: AST.Expression): boolean {
	return (
		ts.isNewExpression(expression) &&
		ts.isIdentifier(expression.expression) &&
		expression.expression.text === "Set"
	);
}

function isSetExpression(
	expression: AST.Expression,
	typeChecker: Checker,
): boolean {
	const unwrapped = unwrapParentheses(expression);

	if (isNewSetExpression(unwrapped)) {
		return true;
	}

	if (ts.isIdentifier(unwrapped)) {
		const symbol = typeChecker.getSymbolAtLocation(unwrapped);
		if (!symbol?.valueDeclaration) {
			return false;
		}

		if (!ts.isVariableDeclaration(symbol.valueDeclaration)) {
			return false;
		}

		const declaration = symbol.valueDeclaration;
		const variableDeclarationList = declaration.parent;

		if (
			!ts.isVariableDeclarationList(variableDeclarationList) ||
			!(variableDeclarationList.flags & ts.NodeFlags.Const)
		) {
			return false;
		}

		if (!declaration.initializer) {
			return false;
		}

		return isNewSetExpression(unwrapParentheses(declaration.initializer));
	}

	return false;
}

function unwrapParentheses(expression: AST.Expression): AST.Expression {
	while (ts.isParenthesizedExpression(expression)) {
		expression = expression.expression;
	}
	return expression;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer `Set.size` over spreading into an array and accessing `.length`.",
		id: "setSizeLengthChecks",
		presets: ["logical"],
	},
	messages: {
		preferSize: {
			primary:
				"Prefer `Set.size` instead of spreading into an array and accessing `.length`.",
			secondary: [
				"Set has a built-in `.size` property that avoids creating an intermediate array.",
			],
			suggestions: ["Use `.size` directly on the Set instead."],
		},
	},
	setup(context) {
		return {
			visitors: {
				PropertyAccessExpression: (node, { sourceFile, typeChecker }) => {
					if (node.questionDotToken) {
						return;
					}

					if (node.name.text !== "length") {
						return;
					}

					const arrayExpression = node.expression;

					if (!ts.isArrayLiteralExpression(arrayExpression)) {
						return;
					}

					if (arrayExpression.elements.length !== 1) {
						return;
					}

					const element = arrayExpression.elements[0];

					if (!element || !ts.isSpreadElement(element)) {
						return;
					}

					const spreadArgument = element.expression;

					if (!isSetExpression(spreadArgument, typeChecker)) {
						return;
					}

					context.report({
						message: "preferSize",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
