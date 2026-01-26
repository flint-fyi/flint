import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports usage of trimLeft and trimRight instead of trimStart and trimEnd.",
		id: "stringTrimMethods",
		presets: ["logical"],
	},
	messages: {
		preferTrimStart: {
			primary: "Prefer `trimStart()` over `trimLeft()`.",
			secondary: [
				"trimLeft is a deprecated alias for trimStart.",
				"trimStart uses direction-independent terminology.",
			],
			suggestions: ["Replace with trimStart()."],
		},
		preferTrimEnd: {
			primary: "Prefer `trimEnd()` over `trimRight()`.",
			secondary: [
				"trimRight is a deprecated alias for trimEnd.",
				"trimEnd uses direction-independent terminology.",
			],
			suggestions: ["Replace with trimEnd()."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node: AST.CallExpression, { sourceFile }) {
					if (!ts.isPropertyAccessExpression(node.expression)) {
						return;
					}

					const methodName = node.expression.name.text;

					if (methodName !== "trimLeft" && methodName !== "trimRight") {
						return;
					}

					if (node.arguments.length !== 0) {
						return;
					}

					const message =
						methodName === "trimLeft" ? "preferTrimStart" : "preferTrimEnd";

					context.report({
						message,
						range: {
							begin: node.expression.name.getStart(sourceFile),
							end: node.expression.name.getEnd(),
						},
					});
				},
			},
		};
	},
});
