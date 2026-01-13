import ts from "typescript";
import { z } from "zod";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

const styleSchema = z
	.enum(["declaration", "expression"])
	.default("expression")
	.describe(
		"Which function style to enforce: 'declaration' for function declarations, 'expression' for function expressions.",
	);

function isOverloadedDeclaration(
	node: ts.FunctionDeclaration,
	sourceFile: ts.SourceFile,
) {
	if (!node.name) {
		return false;
	}

	const name = node.name.text;
	const statements = sourceFile.statements;
	let count = 0;

	for (const statement of statements) {
		if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) {
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
			primary: "Use a function declaration instead of a function expression.",
			secondary: [
				"Function declarations are hoisted and provide clearer intent for named functions.",
			],
			suggestions: [
				"Convert this function expression to a function declaration.",
			],
		},
		preferExpression: {
			primary: "Use a function expression instead of a function declaration.",
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
		style: styleSchema,
	},
	setup(context) {
		return {
			visitors: {
				FunctionDeclaration: (node, { options, sourceFile }) => {
					if (options.style !== "expression") {
						return;
					}

					if (!node.name) {
						return;
					}

					if (isOverloadedDeclaration(node, sourceFile)) {
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
						if (!declaration.initializer) {
							continue;
						}

						const initializer = declaration.initializer;

						if (ts.isArrowFunction(initializer)) {
							if (options.allowArrowFunctions) {
								continue;
							}

							context.report({
								message: "preferDeclaration",
								range: getTSNodeRange(declaration.name, sourceFile),
							});
							continue;
						}

						if (ts.isFunctionExpression(initializer)) {
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
