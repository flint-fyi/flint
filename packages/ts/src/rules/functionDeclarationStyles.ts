import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

function isOverloadedDeclaration(
	node: AST.FunctionDeclaration,
	sourceFile: ts.SourceFile,
) {
	if (!node.name) {
		return false;
	}

	const statements = sourceFile.statements;
	let count = 0;

	for (const statement of statements) {
		if (
			ts.isFunctionDeclaration(statement) &&
			statement.name?.text === node.name.text
		) {
			count++;
			if (count > 1) {
				return true;
			}
		}
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports functions that don't match the configured style (declaration vs expression).",
		id: "functionDeclarationStyles",
		presets: ["stylistic"],
	},
	messages: {
		preferDeclaration: {
			primary:
				"For consistency, this project prefers a function declaration instead of a function expression.",
			secondary: [
				"Function declarations are hoisted and provide clearer intent for named functions.",
			],
			suggestions: [
				"Convert this function expression to a function declaration.",
			],
		},
		preferExpression: {
			primary:
				"For consistency, this project prefers a function expression instead of a function declaration.",
			secondary: [
				"Function expressions assigned to variables provide consistent syntax with arrow functions.",
			],
			suggestions: [
				"Convert this function declaration to a function expression assigned to a variable.",
			],
		},
	},
	options: {
		allowArrowFunctions: z
			.boolean()
			.default(false)
			.describe(
				"Whether to allow arrow functions when style is 'declaration'.",
			),
		style: z
			.enum(["declaration", "expression"])
			.default("expression")
			.describe(
				"Which function style to enforce: 'declaration' for function declarations or 'expression' for function expressions.",
			),
	},
	setup(context) {
		return {
			visitors: {
				FunctionDeclaration: (node, { options, sourceFile }) => {
					if (
						options.style !== "expression" ||
						!node.name ||
						isOverloadedDeclaration(node, sourceFile)
					) {
						return;
					}

					context.report({
						message: "preferExpression",
						range: getTSNodeRange(node.name, sourceFile),
					});
				},

				VariableStatement: (node, { options, sourceFile }) => {
					if (options.style !== "declaration") {
						return;
					}

					for (const declaration of node.declarationList.declarations) {
						switch (declaration.initializer?.kind) {
							case ts.SyntaxKind.ArrowFunction:
								if (!options.allowArrowFunctions) {
									context.report({
										message: "preferDeclaration",
										range: getTSNodeRange(declaration.name, sourceFile),
									});
								}
								break;

							case ts.SyntaxKind.FunctionExpression:
								context.report({
									message: "preferDeclaration",
									range: getTSNodeRange(declaration.name, sourceFile),
								});
						}
					}
				},
			},
		};
	},
});
