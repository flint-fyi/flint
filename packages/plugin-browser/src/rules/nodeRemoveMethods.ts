import {
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { nullThrows } from "@flint.fyi/utils";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer the modern `node.remove()` method over the legacy `parentNode.removeChild(node)` API.",
		id: "nodeRemoveMethods",
		preset: "logical",
	},
	messages: {
		preferRemove: {
			primary:
				"Prefer the modern `{{ child }}.remove()` over `{{ parent }}.removeChild({{ child }})`.",
			secondary: [
				"The `Node.remove()` method is a more direct and modern way to remove an element from the DOM.",
				"It's more concise and easier to read than the legacy `removeChild()` API.",
			],
			suggestions: ["Use `{{ child }}.remove()` instead."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					if (
						node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
						node.expression.name.kind !== SyntaxKind.Identifier ||
						node.expression.name.text !== "removeChild" ||
						node.arguments.length !== 1 ||
						!isGlobalDeclaration(node.expression, typeChecker)
					) {
						return;
					}

					const parentText = node.expression.expression.getText(sourceFile);
					const childText = nullThrows(
						node.arguments[0],
						"First argument is expected to be present by prior length check",
					).getText(sourceFile);

					context.report({
						data: {
							child: childText,
							parent: parentText,
						},
						fix: [
							{
								range: getTSNodeRange(node, sourceFile),
								text: `${childText}.remove()`,
							},
						],
						message: "preferRemove",
						range: getTSNodeRange(node.expression.name, sourceFile),
					});
				},
			},
		};
	},
});
