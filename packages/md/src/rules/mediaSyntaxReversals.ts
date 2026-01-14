import { markdownLanguage } from "@flint.fyi/markdown-language";
import type { WithPosition } from "@flint.fyi/markdown-language";
import type { Heading, Paragraph, Text } from "mdast";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description: "Reports reversed link and image syntax in Markdown.",
		id: "mediaSyntaxReversals",
		presets: ["logical"],
	},
	messages: {
		reversedImage: {
			primary: "This image syntax is reversed and will not render as an image.",
			secondary: [
				"Image syntax requires exclamation mark, square brackets, then parentheses: ![alt](url).",
				"The syntax !(text)[url] is invalid and won't render correctly.",
				"Place the alt text in square brackets and the URL in parentheses.",
			],
			suggestions: [
				"Change to correct syntax: ![alt](url)",
				"Ensure square brackets come before parentheses",
			],
		},
		reversedLink: {
			primary: "This link syntax is reversed and will not render as a link.",
			secondary: [
				"Link syntax requires square brackets followed by parentheses: [text](url).",
				"The syntax (text)[url] is invalid and won't render correctly.",
				"Place the link text in square brackets and the URL in parentheses.",
			],
			suggestions: [
				"Change to correct syntax: [text](url)",
				"Ensure square brackets come before parentheses",
			],
		},
	},
	setup(context) {
		function checkNode(node: WithPosition<Heading | Paragraph>) {
			for (let i = 0; i < node.children.length - 1; i += 1) {
				const child = node.children[i];
				if (child?.type !== "link") {
					continue;
				}

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const previous = node.children[i - 1]!;
				if (previous.type !== "text" || !previous.value.endsWith("[")) {
					continue;
				}

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const next = node.children[i + 1]!;
				if (next.type !== "text") {
					continue;
				}

				const offset = getAutolinkOffsetAt(node, i);
				const prefixLength =
					previous.value.length - previous.value.lastIndexOf("(");

				context.report({
					message: "reversedLink",
					range: {
						begin: offset - prefixLength,
						end: offset + child.url.length + 1,
					},
				});
			}
		}
		return {
			visitors: {
				heading: checkNode,
				paragraph: checkNode,
				text(node: WithPosition<Text>) {
					for (const [message, pattern] of [
						["reversedImage", /!\([^)]+\)\[[^\]]+\]/g],
						["reversedLink", /(?<!!)\([^)]+\)\[[^\]]+\]/g],
					] as const) {
						let match: null | RegExpExecArray;

						while ((match = pattern.exec(node.value)) !== null) {
							const begin = node.position.start.offset + match.index;
							const end = begin + match[0].length;

							context.report({
								message,
								range: { begin, end },
							});
						}
					}
				},
			},
		};
	},
});

// GFM autolinks aren't given a position by mdast-util-gfm-autolink-literal.
// https://github.com/syntax-tree/mdast-util-gfm-autolink-literal/issues/6
// https://github.com/remarkjs/remark-gfm/issues/16
// https://github.com/remarkjs/remark-gfm/issues/79
// Also note: this can technically be exponential in growth if multiple
// children are improper links. We assume that won't be common in practice.
function getAutolinkOffsetAt(
	node: WithPosition<Heading | Paragraph>,
	at: number,
) {
	return node.children.slice(0, at).reduce(
		(offset, child, i): number => {
			return (
				offset +
				(child.type === "text"
					? child.value.length
					: (child.position?.start.offset ?? getAutolinkOffsetAt(node, i)))
			);
		},
		node.position.start.offset + (node.type === "heading" ? node.depth + 1 : 0),
	);
}
