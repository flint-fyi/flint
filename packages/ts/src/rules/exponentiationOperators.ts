import {
	getTSNodeRange,
	isGlobalDeclarationOfName,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Prefers the ** operator over Math.pow().",
		id: "exponentiationOperators",
		presets: ["stylistic"],
	},
	messages: {
		preferOperator: {
			primary:
				"Prefer the more succinct `**` operator instead of Math.pow() for exponentiation.",
			secondary: [
				"The `**` operator was introduced in ES2016 and is more readable.",
				"It also works with BigInt values, unlike Math.pow().",
			],
			suggestions: ["`Replace Math.pow(base, exponent)` with `**`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!ts.isPropertyAccessExpression(node.expression) ||
						node.expression.name.text !== "pow" ||
						node.expression.expression.kind !== SyntaxKind.Identifier ||
						node.expression.expression.text !== "Math" ||
						node.arguments.length !== 2 ||
						!isGlobalDeclarationOfName(
							node.expression.expression,
							"Math",
							typeChecker,
						)
					) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					context.report({
						fix: {
							range,
							text: node.arguments
								.map((argument) => argument.getText(sourceFile))
								.join(" ** "),
						},
						message: "preferOperator",
						range,
					});
				},
			},
		};
	},
});
