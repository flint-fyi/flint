import * as ts from "typescript";

import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Enforces a consistent naming convention for catch clause error variables.",
		id: "caughtVariableNames",
		preset: "stylistic",
		strictness: "strict",
	},
	messages: {
		preferErrorName: {
			primary:
				"Use `error` as the name for the catch clause parameter instead of `{{ name }}`.",
			secondary: [
				"Consistent naming of catch clause parameters improves code readability.",
				"The name `error` clearly indicates the purpose of the variable.",
				"Descriptive names ending in 'Error' are generally also acceptable.",
			],
			suggestions: [
				"Rename `{{ name }}` to `error`.",
				"Rename `{{ name }}` to a name ending with `Error`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CatchClause: (node, { sourceFile }) => {
					const variable = node.variableDeclaration;
					if (!variable || !ts.isIdentifier(variable.name)) {
						return;
					}

					const name = variable.name.text;

					if (name === "error" || name.endsWith("Error")) {
						return;
					}

					context.report({
						data: { name },
						message: "preferErrorName",
						range: {
							begin: variable.name.getStart(sourceFile),
							end: variable.name.getEnd(),
						},
					});
				},
			},
		};
	},
});
