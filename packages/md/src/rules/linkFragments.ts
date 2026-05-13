import { markdownLanguage } from "@flint.fyi/markdown-language";
import GithubSlugger from "github-slugger";
import type { Node, Text } from "mdast";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description: "Reports link fragments that don't exist in the document.",
		id: "linkFragments",
		presets: ["logical"],
	},
	messages: {
		missingFragment: {
			primary:
				"This link fragment '{{ fragment }}' does not exist in the document.",
			secondary: [
				"Link fragments (URLs that start with #) should reference valid headings or anchors in the document.",
				"This helps prevent broken internal links when the document is rendered.",
				"Fragments are generated from headings using GitHub's slugging algorithm, or from HTML anchor IDs.",
			],
			suggestions: [
				"Check the heading text and ensure the fragment matches the generated ID",
				"Add a heading or HTML anchor with this ID",
				"Fix the fragment to match an existing heading",
			],
		},
	},
	setup(context) {
		const slugger = new GithubSlugger();
		const validFragments = new Set<string>();
		const linksToCheck: {
			begin: number;
			end: number;
			fragment: string;
		}[] = [];

		// Collect text content from a node tree (for headings)
		function collectText(n: Node): string {
			if (n.type === "text") {
				return (n as Text).value;
			}
			if ("children" in n && Array.isArray(n.children)) {
				return (n.children as Node[])
					.map((child) => collectText(child))
					.join("");
			}
			return "";
		}

		return {
			visitors: {
				heading(node) {
					const headingText = collectText(node);

					// Generate slug for this heading using github-slugger
					const slug = slugger.slug(headingText);
					validFragments.add(slug);
				},
				html(node) {
					// Extract id and name attributes from HTML
					// Match: <... id="value" ...> or <... name="value" ...>
					const idMatches = node.value.matchAll(
						/\b(?:id|name)=["']([^"']+)["']/g,
					);
					for (const match of idMatches) {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						validFragments.add(match[1]!);
					}
				},
				link(node) {
					// Check if this is a fragment link (starts with #)
					if (node.url.startsWith("#")) {
						const fragment = node.url.slice(1); // Remove the #
						if (fragment) {
							// Decode URI components (e.g., %C3%A9 -> é)
							const decodedFragment = decodeURIComponent(fragment);
							linksToCheck.push({
								begin: node.position.start.offset,
								end: node.position.end.offset,
								fragment: decodedFragment,
							});
						}
					}
				},
				root() {
					slugger.reset();
					validFragments.clear();
					// Always allow #top as it's a standard browser fragment
					validFragments.add("top");
					linksToCheck.length = 0;
				},
				"root:exit"() {
					// Check all fragment links
					for (const link of linksToCheck) {
						// Check if fragment exists (case-insensitive by default, matching GitHub)
						const fragmentLower = link.fragment.toLowerCase();
						let found = false;

						for (const validFragment of validFragments) {
							if (validFragment.toLowerCase() === fragmentLower) {
								found = true;
								break;
							}
						}

						if (!found) {
							context.report({
								data: { fragment: link.fragment },
								message: "missingFragment",
								range: {
									begin: link.begin,
									end: link.end,
								},
							});
						}
					}
				},
			},
		};
	},
});
