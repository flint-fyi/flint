import { yamlLanguage } from "@flint.fyi/yaml-language";
import type * as yaml from "yaml-unist-parser";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(yamlLanguage, {
	about: {
		description:
			"Reports empty YAML documents that contain only document markers.",
		id: "emptyDocuments",
		presets: ["logical"],
	},
	messages: {
		emptyDocument: {
			primary:
				"This YAML document contains no content beyond document markers.",
			secondary: [
				"Empty YAML documents serve no purpose and typically result from editing mistakes or incomplete refactoring.",
				"Removing empty documents improves file clarity and prevents potential confusion when parsing or maintaining YAML files.",
			],
			suggestions: [
				"Remove the empty document entirely.",
				"Add content to the document if it was intended to hold data.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				document: (node, { root }) => {
					const [documentHead, documentBody] = node.children;
					if (documentBody.children.length !== 0) {
						return;
					}

					context.report({
						fix: {
							range: {
								begin: node.position.start.offset,
								end: getDocumentEnd(node, root),
							},
							text: "",
						},
						message: "emptyDocument",
						range: {
							begin: documentHead.position.start.offset,
							end: documentHead.position.end.offset,
						},
					});
				},
			},
		};
	},
});

function getDocumentEnd(node: yaml.Document, root: yaml.Root) {
	const documentIndex = root.children.indexOf(node);

	if (documentIndex < root.children.length - 1) {
		const nextChild = root.children[documentIndex + 1];
		if (nextChild) {
			return nextChild.position.start.offset;
		}
	}

	return node.position.end.offset;
}
