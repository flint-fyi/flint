import { getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Disallow unnecessary JSX curly braces around literals and JSX elements.",
		id: "bracedStatements",
		preset: "stylistic",
	},
	messages: {
		unnecessaryBraces: {
			primary: "Curly braces are unnecessary around {{ type }}.",
			secondary: [
				"Curly braces are unnecessary when they wrap simple literals or JSX elements.",
				"Removing them improves readability and reduces visual clutter.",
			],
			suggestions: ["Remove the curly braces and use the content directly."],
		},
	},
	setup(context) {
		return {
			visitors: {
				JsxExpression(node, { sourceFile }) {
					if (
						!node.expression ||
						(node.parent.kind !== SyntaxKind.JsxElement &&
							node.parent.kind !== SyntaxKind.JsxFragment)
					) {
						return;
					}

					let unnecessaryType: string | undefined;

					if (node.expression.kind === SyntaxKind.StringLiteral) {
						unnecessaryType = "string literals";
					} else if (
						node.expression.kind === SyntaxKind.JsxElement ||
						node.expression.kind === SyntaxKind.JsxSelfClosingElement ||
						node.expression.kind === SyntaxKind.JsxFragment
					) {
						unnecessaryType = "JSX elements";
					}

					if (unnecessaryType) {
						context.report({
							data: { type: unnecessaryType },
							message: "unnecessaryBraces",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
