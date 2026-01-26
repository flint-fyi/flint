import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports usage of substr and substring instead of slice for string operations.",
		id: "stringSliceMethods",
		presets: ["logical"],
	},
	messages: {
		preferSliceOverSubstr: {
			primary: "Prefer `slice` over the deprecated `substr` method.",
			secondary: [
				"substr is deprecated and removed from the ECMAScript specification.",
				"slice has consistent behavior matching Array.prototype.slice.",
			],
			suggestions: ["Replace with slice()."],
		},
		preferSliceOverSubstring: {
			primary: "Prefer `slice` over `substring` for more consistent behavior.",
			secondary: [
				"substring auto-swaps arguments if start > end, which can be confusing.",
				"substring treats negative indices as 0, unlike slice.",
				"slice has predictable behavior matching Array.prototype.slice.",
			],
			suggestions: ["Replace with slice()."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					if (!ts.isPropertyAccessExpression(node.expression)) {
						return;
					}

					const methodName = node.expression.name.text;

					if (methodName === "substr") {
						context.report({
							message: "preferSliceOverSubstr",
							range: {
								begin: node.expression.name.getStart(sourceFile),
								end: node.expression.name.getEnd(),
							},
						});
					} else if (methodName === "substring") {
						context.report({
							message: "preferSliceOverSubstring",
							range: {
								begin: node.expression.name.getStart(sourceFile),
								end: node.expression.name.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
