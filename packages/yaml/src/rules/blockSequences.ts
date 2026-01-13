import type * as yamlParser from "yaml-unist-parser";

import { yamlLanguage } from "../language.ts";

function buildBlockSequenceFix(
	node: yamlParser.FlowSequence,
	sourceText: string,
): string {
	const indent = getExpectedIndent(node);
	const items: string[] = [];

	for (const item of node.children) {
		if (item.children.length > 0) {
			const child = item.children[0];
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const itemText = getNodeText(child!, sourceText);
			items.push(`\n${indent}- ${itemText}`);
		}
	}

	return items.join("");
}

function getExpectedIndent(node: yamlParser.FlowSequence): string {
	let current: null | undefined | yamlParser.YamlUnistNode = node._parent;

	while (current) {
		if (current.type === "mappingValue" && current._parent) {
			const mappingItem = current._parent;
			if (mappingItem.type === "mappingItem" && mappingItem._parent) {
				const mappingItemColumn = mappingItem.position.start.column;
				return " ".repeat(mappingItemColumn + 1);
			}
		}
		current = current._parent;
	}

	return "  ";
}

function getNodeText(
	node: yamlParser.YamlUnistNode,
	sourceText: string,
): string {
	return sourceText.substring(
		node.position.start.offset,
		node.position.end.offset,
	);
}

export default yamlLanguage.createRule({
	about: {
		description: "Prefer block style sequences over flow style sequences.",
		id: "blockSequences",
		preset: "stylistic",
	},
	messages: {
		flowSequence: {
			primary: "Prefer block style sequences over flow style sequences.",
			secondary: [
				"Block style sequences use hyphens and are generally more readable for multi-item lists.",
				"Flow style sequences use brackets and are more compact but less clear in most cases.",
			],
			suggestions: [
				"Rewrite the flow sequence using block style with each item on its own line preceded by a hyphen.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				flowSequence: (node, services) => {
					const fixText = buildBlockSequenceFix(node, services.sourceText);

					context.report({
						fix: {
							range: {
								begin: node.position.start.offset,
								end: node.position.end.offset,
							},
							text: fixText,
						},
						message: "flowSequence",
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
