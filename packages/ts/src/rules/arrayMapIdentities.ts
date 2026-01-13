import * as ts from "typescript";

import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports using `.flatMap()` with an identity function that returns its argument unchanged.",
		id: "arrayMapIdentities",
		preset: "logical",
	},
	messages: {
		identityFlatMap: {
			primary:
				"Prefer `.flat()` over `.flatMap()` when the callback returns its argument unchanged.",
			secondary: [
				"Using an identity function with `.flatMap()` is equivalent to calling `.flat()`.",
				"Using `.flat()` is more concise and expresses intent more clearly.",
			],
			suggestions: ["Replace `.flatMap(...)` with `.flat()`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile }) => {
					if (
						!ts.isPropertyAccessExpression(node.expression) ||
						node.expression.name.text !== "flatMap" ||
						node.arguments.length !== 1
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const callback = node.arguments[0]!;
					if (!isIdentityFunction(callback)) {
						return;
					}

					const objectText = node.expression.expression.getText(sourceFile);

					context.report({
						fix: {
							range: {
								begin: node.getStart(sourceFile),
								end: node.getEnd(),
							},
							text: `${objectText}.flat()`,
						},
						message: "identityFlatMap",
						range: {
							begin: node.expression.name.getStart(sourceFile) - 1,
							end: node.getEnd(),
						},
					});
				},
			},
		};
	},
});

function blockReturnsIdentifier(block: ts.Block, parameterName: string) {
	if (block.statements.length !== 1) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const statement = block.statements[0]!;
	if (!ts.isReturnStatement(statement) || !statement.expression) {
		return false;
	}

	return expressionMatchesName(statement.expression, parameterName);
}

function expressionMatchesName(expression: ts.Expression, name: string) {
	const unwrapped = ts.isParenthesizedExpression(expression)
		? expression.expression
		: expression;

	return ts.isIdentifier(unwrapped) && unwrapped.text === name;
}

function getSingleParameterName(
	parameters: ts.NodeArray<ts.ParameterDeclaration>,
) {
	if (parameters.length !== 1) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const parameter = parameters[0]!;
	if (!ts.isIdentifier(parameter.name)) {
		return undefined;
	}

	return parameter.name.text;
}

function isIdentityArrowFunction(node: ts.ArrowFunction) {
	const parameterName = getSingleParameterName(node.parameters);
	if (!parameterName) {
		return false;
	}

	if (ts.isBlock(node.body)) {
		return blockReturnsIdentifier(node.body, parameterName);
	}

	return expressionMatchesName(node.body, parameterName);
}

function isIdentityFunction(node: ts.Node): boolean {
	if (ts.isArrowFunction(node)) {
		return isIdentityArrowFunction(node);
	}

	if (ts.isFunctionExpression(node)) {
		return isIdentityFunctionExpression(node);
	}

	return false;
}

function isIdentityFunctionExpression(node: ts.FunctionExpression) {
	const parameterName = getSingleParameterName(node.parameters);
	if (!parameterName) {
		return false;
	}

	return blockReturnsIdentifier(node.body, parameterName);
}
