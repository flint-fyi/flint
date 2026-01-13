import { getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Disallow the use of the `accessKey` / `accesskey` attribute on JSX elements.",
		id: "accessKeys",
		preset: "logical",
	},
	messages: {
		avoidAccessKey: {
			primary:
				"The native DOM `{{ attribute }}` prop causes accessibility issues with keyboard-only users and screen readers.",
			secondary: [
				"Access keys are inconsistent across browsers and can interfere with assistive technologies.",
				"Although they may work in limited use cases, it's best to avoid them.",
			],
			suggestions: [
				"Remove the attribute and provide a documented, configurable keyboard shortcut instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				JsxAttribute(node, { sourceFile }) {
					if (node.name.kind !== SyntaxKind.Identifier) {
						return;
					}

					const attribute = node.name.text;
					if (attribute.toLowerCase() !== "accesskey") {
						return;
					}

					context.report({
						data: { attribute },
						message: "avoidAccessKey",
						range: getTSNodeRange(node.name, sourceFile),
					});
				},
			},
		};
	},
});
