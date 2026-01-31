import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports usage of `substring` instead of slice for string operations.",
		id: "stringSliceMethods",
		presets: ["logical"],
	},
	messages: {
		preferSliceOverSubstring: {
			primary: "Prefer `slice` over `substring` for more consistent behavior.",
			secondary: [
				"`slice` has predictable behavior matching `Array.prototype.slice`.",
				"`substring` auto-swaps arguments if start > end, which can be confusing.",
				"`substring` also treats negative indices as 0, unlike `slice`.",
			],
			suggestions: ["Replace with slice()."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					if (
						ts.isPropertyAccessExpression(node.expression) &&
						node.expression.name.text === "substring" &&
						tsutils.isTypeFlagSet(
							getConstrainedTypeAtLocation(node, typeChecker),
							ts.TypeFlags.StringLike,
						)
					) {
						const args = node.arguments.map((arg) => arg.getText(sourceFile));
						const receiver = node.expression.expression.getText(sourceFile);
						const replacement = !args.length
							? `${receiver}.slice()`
							: args.length === 1
								? `${receiver}.slice(${args[0]})`
								: `${receiver}.slice(${args[0]}, ${args[1]})`;

						context.report({
							message: "preferSliceOverSubstring",
							range: getTSNodeRange(node.expression.name, sourceFile),
							suggestions: [
								{
									id: "replaceWithSlice",
									range: {
										begin: node.getStart(sourceFile),
										end: node.getEnd(),
									},
									text: replacement,
								},
							],
						});
					}
				},
			},
		};
	},
});
