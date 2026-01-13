import type * as yaml from "yaml-unist-parser";

import { yamlLanguage } from "../language.ts";

/**
 * Calculate the expected indentation for a flow mapping's pairs when converted to block style.
 */
function calculateIndent(node: yaml.FlowMapping, sourceText: string) {
	const lineStart =
		sourceText.lastIndexOf("\n", node.position.start.offset) + 1;
	const beforeNode = sourceText.substring(
		lineStart,
		node.position.start.offset,
	);

	const leadingWhitespace = /^\s*/.exec(beforeNode)?.[0] ?? "";

	return leadingWhitespace + "  ";
}

function getNodeText(
	node: yaml.MappingKey | yaml.MappingValue,
	sourceText: string,
) {
	return sourceText.substring(
		node.children[0]?.position.start.offset ?? node.position.start.offset,
		node.children[0]?.position.end.offset ?? node.position.end.offset,
	);
}

/**
 * Check if a flow mapping can be safely converted to block style.
 */
function canConvertToBlock(node: yaml.FlowMapping) {
	for (const child of node.children) {
		const keyNode = child.children[0];
		const valueNode = child.children[1];
		if (keyNode.children.length === 0 || valueNode.children.length === 0) {
			return false;
		}
	}

	return true;
}

/**
 * Convert a flow mapping to block style.
 */
function convertToBlock(node: yaml.FlowMapping, sourceText: string) {
	const indent = calculateIndent(node, sourceText);
	const pairs: string[] = [];

	for (const child of node.children) {
		const [keyNode, valueNode] = child.children;
		const keyText = getNodeText(keyNode, sourceText);
		const valueChild = valueNode.children[0];

		if (valueChild) {
			const valueText = sourceText.substring(
				valueChild.position.start.offset,
				valueChild.position.end.offset,
			);

			pairs.push(`${indent}${keyText}: ${valueText}`);
		}
	}

	return "\n" + pairs.join("\n");
}

export default yamlLanguage.createRule({
	about: {
		description: "Prefer block-style mappings over flow-style mappings.",
		id: "blockMappings",
		preset: "stylistic",
	},
	messages: {
		preferBlock: {
			primary:
				"Prefer block-style mappings over flow-style mappings for improved readability.",
			secondary: [
				"Flow-style mappings (e.g., {key: value}) can be harder to read and maintain, especially with nested structures.",
				"Block-style mappings use indentation to show structure, making the YAML more readable and consistent with common YAML conventions.",
			],
			suggestions: ["Convert to block-style mapping."],
		},
	},
	setup(context) {
		return {
			visitors: {
				flowMapping: (node, { sourceText }) => {
					context.report({
						fix: canConvertToBlock(node)
							? {
									range: {
										begin: node.position.start.offset,
										end: node.position.end.offset,
									},
									text: convertToBlock(node, sourceText),
								}
							: undefined,
						message: "preferBlock",
						range: {
							begin: node.position.start.offset,
							end: node.position.end.offset,
						},
					});
				},
			},
		};
	},
});
