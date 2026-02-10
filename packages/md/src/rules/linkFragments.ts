import { markdownLanguage } from "@flint.fyi/markdown-language";
import type { WithPosition } from "@flint.fyi/markdown-language";
import GithubSlugger from "github-slugger";
import type { Heading, Html, Link, Node, Root, Text } from "mdast";

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
		return {
			visitors: {
				root(node: WithPosition<Root>) {
					const validFragments = new Set<string>();
					const linksToCheck: {
						begin: number;
						end: number;
						fragment: string;
					}[] = [];

					// Always allow #top as it's a standard browser fragment
					validFragments.add("top");

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

					// Traverse the tree to collect headings, HTML anchors, and links
					function visit(n: Node): void {
						if (n.type === "heading") {
							const heading = n as Heading;
							const headingText = collectText(heading);

							// Generate slug for this heading using github-slugger
							const slug = slugger.slug(headingText);
							validFragments.add(slug);
						} else if (n.type === "html") {
							const html = n as Html;
							// Extract id and name attributes from HTML
							// Match: <... id="value" ...> or <... name="value" ...>
							const idMatches = html.value.matchAll(
								/\b(?:id|name)=["']([^"']+)["']/g,
							);
							for (const match of idMatches) {
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
								validFragments.add(match[1]!);
							}
						} else if (n.type === "link") {
							const link = n as Link;
							// Check if this is a fragment link (starts with #)
							if (
								link.url.startsWith("#") &&
								link.position?.start.offset !== undefined &&
								link.position.end.offset !== undefined
							) {
								const fragment = link.url.slice(1); // Remove the #
								if (fragment) {
									// Decode URI components (e.g., %C3%A9 -> é)
									const decodedFragment = decodeURIComponent(fragment);
									linksToCheck.push({
										begin: link.position.start.offset,
										end: link.position.end.offset,
										fragment: decodedFragment,
									});
								}
							}
						}

						if ("children" in n && Array.isArray(n.children)) {
							for (const child of n.children as Node[]) {
								visit(child);
							}
						}
					}

					// TODO: Add :exit selectors, so this rule can report after traversal
					// https://github.com/flint-fyi/flint/issues/2271
					visit(node);

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
