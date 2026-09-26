import z from "zod/v4";

import { markdownLanguage } from "@flint.fyi/markdown-language";

import { getChangesetSummary } from "../utils/getChangesetSummary.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description:
			"Reports changeset summaries that don't match the configured ending punctuation.",
		id: "summaryPunctuation",
		presets: ["stylistic"],
	},
	messages: {
		missingPunctuation: {
			primary:
				"This changeset summary does not end with punctuation as preferred for consistency.",
			secondary: [
				"Changesets copies each summary into the CHANGELOG.md of every package it releases.",
				"Ending every summary the same way makes changelog entries consistent to read.",
				"This rule is configured to expect summaries that end with a period, exclamation mark, or question mark.",
			],
			suggestions: ["Add a period to the end of the summary."],
		},
		unnecessaryPunctuation: {
			primary:
				"This changeset summary ends with punctuation, but for consistency should not.",
			secondary: [
				"Changesets copies each summary into the CHANGELOG.md of every package it releases.",
				"Ending every summary the same way makes changelog entries consistent to read.",
				"This rule is configured to expect summaries that don't end with a period, exclamation mark, or question mark.",
			],
			suggestions: ["Remove the punctuation from the end of the summary."],
		},
	},
	options: {
		punctuation: z
			.enum(["always", "never"])
			.default("always")
			.describe("Whether changeset summaries must end with punctuation."),
	},
	setup(context) {
		return {
			visitors: {
				root: (node, { options, sourceText }) => {
					const summary = getChangesetSummary(node);
					if (!summary) {
						return;
					}

					const [paragraph] = summary.nodes;
					if (paragraph?.type !== "paragraph") {
						return;
					}

					const { end } = paragraph.position;
					const text = sourceText.slice(
						paragraph.position.start.offset,
						end.offset,
					);

					if (options.punctuation === "never") {
						const punctuation = /[!.?…]+$/u.exec(text)?.[0];
						if (!punctuation) {
							return;
						}

						const range = {
							begin: end.offset - punctuation.length,
							end: end.offset,
						};

						context.report({
							fix: { range, text: "" },
							message: "unnecessaryPunctuation",
							range,
						});
						return;
					}

					if (
						/[!.?…]$/u.test(text) ||
						(text.endsWith(":") && summary.nodes.length > 1)
					) {
						return;
					}

					context.report({
						fix: {
							range: { begin: end.offset, end: end.offset },
							text: ".",
						},
						message: "missingPunctuation",
						range: { begin: end.offset - 1, end: end.offset },
					});
				},
			},
		};
	},
});
