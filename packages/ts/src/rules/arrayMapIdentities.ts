import { SyntaxKind, type NodeArray } from "typescript";

import { typescriptLanguage, type AST } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports using `.flatMap()` with an identity function that returns its argument unchanged.",
		id: "arrayMapIdentities",
		presets: ["logical", "logicalStrict"],
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
						node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
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

function blockReturnsIdentifier(block: AST.Block, parameterName: string) {
	if (block.statements.length !== 1) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const statement = block.statements[0]!;
	if (statement.kind !== SyntaxKind.ReturnStatement || !statement.expression) {
		return false;
	}

	return expressionMatchesName(statement.expression, parameterName);
}

function expressionMatchesName(expression: AST.Expression, name: string) {
	const unwrapped =
		expression.kind === SyntaxKind.ParenthesizedExpression
			? expression.expression
			: expression;

	return unwrapped.kind === SyntaxKind.Identifier && unwrapped.text === name;
}

function getSingleParameterName(
	parameters: NodeArray<AST.ParameterDeclaration>,
) {
	if (parameters.length !== 1) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const parameter = parameters[0]!;
	if (parameter.name.kind !== SyntaxKind.Identifier) {
		return undefined;
	}

	return parameter.name.text;
}

function isIdentityArrowFunction(node: AST.ArrowFunction) {
	const parameterName = getSingleParameterName(node.parameters);
	if (!parameterName) {
		return false;
	}

	if (node.body.kind === SyntaxKind.Block) {
		return blockReturnsIdentifier(node.body, parameterName);
	}

	return expressionMatchesName(node.body, parameterName);
}

function isIdentityFunction(node: AST.AnyNode): boolean {
	if (node.kind === SyntaxKind.ArrowFunction) {
		return isIdentityArrowFunction(node);
	}

	if (node.kind === SyntaxKind.FunctionExpression) {
		return isIdentityFunctionExpression(node);
	}

	return false;
}

function isIdentityFunctionExpression(node: AST.FunctionExpression) {
	const parameterName = getSingleParameterName(node.parameters);
	if (!parameterName) {
		return false;
	}

	return blockReturnsIdentifier(node.body, parameterName);
}
