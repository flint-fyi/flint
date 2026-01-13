import type { CharacterReportRange } from "@flint.fyi/core";
import { type AST, typescriptLanguage } from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Disallow unnecessary JSX fragments that wrap a single child or have no children.",
		id: "unnecessaryFragments",
		preset: "stylistic",
	},
	messages: {
		unnecessaryFragment: {
			primary: "Unnecessary fragment wrapping {{ childType }}.",
			secondary: [
				"Fragments are only needed when rendering multiple adjacent elements.",
				"A fragment wrapping a single child or no children adds unnecessary complexity.",
				"Remove the fragment and use the child directly, or remove empty fragments entirely.",
			],
			suggestions: [
				"Remove the fragment wrapper and use the child element directly.",
			],
		},
	},
	setup(context) {
		function checkNodeChildren(
			node: AST.JsxElement | AST.JsxFragment,
			range: CharacterReportRange,
		) {
			const children = node.children.filter(
				(child) =>
					child.kind !== SyntaxKind.JsxText || child.text.trim().length > 0,
			);

			let childType: string | undefined;

			if (children.length === 0) {
				childType = "no children";
			} else if (children.length === 1) {
				childType = "a single child";
			}

			if (childType) {
				context.report({
					data: { childType },
					message: "unnecessaryFragment",
					range,
				});
			}
		}

		return {
			visitors: {
				JsxElement(node, { sourceFile }) {
					if (
						node.openingElement.tagName.kind === SyntaxKind.Identifier &&
						!node.openingElement.attributes.properties.length &&
						node.openingElement.tagName.text === "Fragment"
					) {
						checkNodeChildren(node, {
							begin: node.openingElement.getStart(sourceFile),
							end: node.closingElement.getEnd(),
						});
					}
				},
				JsxFragment(node, { sourceFile }) {
					checkNodeChildren(node, {
						begin: node.openingFragment.getStart(sourceFile),
						end: node.closingFragment.getEnd(),
					});
				},
			},
		};
	},
});
