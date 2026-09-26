import type { PhrasingContent } from "mdast";
import z from "zod/v4";

import {
	markdownLanguage,
	type WithPosition,
} from "@flint.fyi/markdown-language";

import { getChangesetSummary } from "../utils/getChangesetSummary.ts";
import {
	defaultConventionalTypes,
	getConventionalPrefix,
} from "../utils/getConventionalPrefix.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description:
			"Reports changeset summaries that don't start with the configured letter case.",
		id: "summaryCasing",
		presets: ["stylistic"],
	},
	messages: {
		lowercaseStart: {
			primary:
				"This changeset summary starts with a lowercase letter, but for consistency should be uppercase.",
			secondary: [
				"Changesets copies each summary into the CHANGELOG.md of every package it releases.",
				"Starting every summary with the same letter case makes changelog entries consistent to read.",
				"This rule is configured to expect summaries that start with an uppercase letter.",
			],
			suggestions: ["Uppercase the first letter of the summary."],
		},
		uppercaseStart: {
			primary:
				"This changeset summary starts with an uppercase letter, but for consistency should be lowercase.",
			secondary: [
				"Changesets copies each summary into the CHANGELOG.md of every package it releases.",
				"Starting every summary with the same letter case makes changelog entries consistent to read.",
				"This rule is configured to expect summaries that start with a lowercase letter.",
			],
			suggestions: ["Lowercase the first letter of the summary."],
		},
	},
	options: {
		casing: z
			.enum(["lowercase", "uppercase"])
			.default("uppercase")
			.describe(
				"Which letter case the first letter of changeset summaries must be.",
			),
		types: z
			.array(z.string())
			.default(defaultConventionalTypes)
			.describe(
				"Conventional commit types whose prefixes are skipped before checking the first letter.",
			),
	},
	setup(context) {
		return {
			visitors: {
				root: (node, { options, sourceText }) => {
					const paragraph = getChangesetSummary(node)?.nodes[0];
					if (paragraph?.type !== "paragraph") {
						return;
					}

					const begin =
						paragraph.position.start.offset +
						(getConventionalPrefix(paragraph, sourceText, options.types)
							?.length ?? 0);

					const child = (
						paragraph.children as WithPosition<PhrasingContent>[]
					).find(
						(child) =>
							child.position.start.offset <= begin &&
							begin < child.position.end.offset,
					);
					if (child?.type !== "text") {
						return;
					}

					const word = /^[\p{L}\p{N}]+/u.exec(
						sourceText.slice(begin, child.position.end.offset),
					)?.[0];
					if (!word || /\p{Lu}/u.test(word.slice(1))) {
						return;
					}

					const [character = ""] = word;
					const lowercase = character.toLowerCase();
					const uppercase = character.toUpperCase();
					const replacement =
						options.casing === "uppercase" ? uppercase : lowercase;
					if (lowercase === uppercase || character === replacement) {
						return;
					}

					const range = { begin, end: begin + character.length };

					context.report({
						message:
							options.casing === "uppercase"
								? "lowercaseStart"
								: "uppercaseStart",
						range,
						suggestions: [
							{
								id:
									options.casing === "uppercase"
										? "uppercaseFirstLetter"
										: "lowercaseFirstLetter",
								range,
								text: replacement,
							},
						],
					});
				},
			},
		};
	},
});
