import type { Definition, Image, Link, Node, Root } from "mdast";

import { markdownLanguage } from "../language.ts";
import type { WithPosition } from "../nodes.ts";

export default markdownLanguage.createRule({
	about: {
		description:
			"Reports resource links/images with URLs that match definition identifiers.",
		id: "referenceLikeUrls",
		preset: "logical",
	},
	messages: {
		imageReferenceLike: {
			primary:
				"This image uses a URL '{{ url }}' that matches a definition identifier.",
			secondary: [
				"When a resource image (![text](url)) has a URL that matches a definition identifier, it's likely a mistake.",
				"You probably meant to use a reference image (![text][id]) instead of an inline URL.",
				"Using the reference syntax makes your Markdown more maintainable and avoids confusion.",
			],
			suggestions: [
				"Change to reference syntax: ![text][{{ url }}]",
				"Use a different URL if this is intentional",
			],
		},
		linkReferenceLike: {
			primary:
				"This link uses a URL '{{ url }}' that matches a definition identifier.",
			secondary: [
				"When a resource link ([text](url)) has a URL that matches a definition identifier, it's likely a mistake.",
				"You probably meant to use a reference link ([text][id]) instead of an inline URL.",
				"Using the reference syntax makes your Markdown more maintainable and avoids confusion.",
			],
			suggestions: [
				"Change to reference syntax: [text][{{ url }}]",
				"Use a different URL if this is intentional",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				root(root: WithPosition<Root>) {
					const definitionIdentifiers = new Set<string>();

					function collectDefinitions(node: Node) {
						if (node.type === "definition") {
							definitionIdentifiers.add(
								(node as Definition).identifier.toLowerCase(),
							);
						}

						if ("children" in node && Array.isArray(node.children)) {
							for (const child of node.children as Node[]) {
								collectDefinitions(child);
							}
						}
					}

					function checkLink(node: Link) {
						const urlLower = node.url.toLowerCase();
						if (
							definitionIdentifiers.has(urlLower) &&
							node.position?.start.offset !== undefined &&
							node.position.end.offset !== undefined
						) {
							context.report({
								data: { url: node.url },
								message: "linkReferenceLike",
								range: {
									begin: node.position.start.offset,
									end: node.position.end.offset,
								},
							});
						}
					}

					function checkImage(image: Image) {
						const urlLower = image.url.toLowerCase();
						if (
							definitionIdentifiers.has(urlLower) &&
							image.position?.start.offset !== undefined &&
							image.position.end.offset !== undefined
						) {
							context.report({
								data: { url: image.url },
								message: "imageReferenceLike",
								range: {
									begin: image.position.start.offset,
									end: image.position.end.offset,
								},
							});
						}
					}

					function checkNodes(node: Node) {
						if (node.type === "link") {
							checkLink(node as Link);
						} else if (node.type === "image") {
							checkImage(node as Image);
						} else if ("children" in node && Array.isArray(node.children)) {
							for (const child of node.children as Node[]) {
								checkNodes(child);
							}
						}
					}

					collectDefinitions(root);
					checkNodes(root);
				},
			},
		};
	},
});
