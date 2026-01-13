import { getTSNodeRange, isNodeType, typescriptLanguage } from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Requires passing `sourceFile` to `getStart()` for better performance.",
		id: "getStartSourceFile",
		preset: "logical",
	},
	messages: {
		missingSourceFile: {
			primary:
				"`getStart()` should be called with a `sourceFile` parameter for better performance.",
			secondary: [
				"TypeScript allows calling `node.getStart()` with or without a source file.",
				"Providing the source file is slightly faster because TypeScript doesn't need to traverse up the AST to find it.",
				"Consider using `getTSNodeRange()` helper function which already handles this correctly.",
			],
			suggestions: [
				"Pass `sourceFile` as the argument to `getStart()`: `node.getStart(sourceFile)`.",
				"Or use `getTSNodeRange(node, sourceFile)` helper function instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
						return;
					}

					const propertyAccess = node.expression;

					if (
						!isNodeType(propertyAccess, typeChecker) ||
						propertyAccess.name.kind !== SyntaxKind.Identifier ||
						propertyAccess.name.text !== "getStart"
					) {
						return;
					}

					if (node.arguments.length === 0) {
						context.report({
							message: "missingSourceFile",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
