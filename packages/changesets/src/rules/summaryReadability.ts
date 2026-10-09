import z from "zod/v4";

import { markdownLanguage } from "@flint.fyi/markdown-language";

import { getChangesetSummary } from "../utils/getChangesetSummary.ts";
import {
	defaultConventionalTypes,
	getConventionalPrefix,
} from "../utils/getConventionalPrefix.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(markdownLanguage, {
	about: {
		description:
			"Reports changeset summaries that are missing or start with a conventional commit prefix.",
		id: "summaryReadability",
		presets: ["logical"],
	},
	messages: {
		conventionalPrefix: {
			primary:
				"This changeset summary unnecessarily starts with a conventional commit prefix.",
			secondary: [
				"Changesets copies each summary into the CHANGELOG.md of every package it releases.",
				"Prefixes such as `feat:` or `fix(core):` label commits for tooling, not changes for the package's users.",
				"The kind of change is already recorded by the version bump in the changeset's frontmatter.",
			],
			suggestions: ["Remove the conventional commit prefix."],
		},
		missingSummary: {
			primary: "This changeset has no summary to inform changelog generation.",
			secondary: [
				"Changesets copies each summary into the CHANGELOG.md of every package it releases.",
				"A changeset without a summary creates a changelog entry that doesn't describe its change.",
			],
			suggestions: [
				"Add a summary after the frontmatter that describes the change for the package's users.",
			],
		},
	},
	options: {
		types: z
			.array(z.string())
			.default(defaultConventionalTypes)
			.describe("Conventional commit types whose prefixes should be reported."),
	},
	setup(context) {
		return {
			visitors: {
				root: (node, { options, sourceText }) => {
					const summary = getChangesetSummary(node);
					if (!summary) {
						return;
					}

					const [firstNode] = summary.nodes;
					if (!firstNode) {
						context.report({
							message: "missingSummary",
							range: {
								begin: summary.frontmatter.position.start.offset,
								end: summary.frontmatter.position.end.offset,
							},
						});
						return;
					}

					if (firstNode.type !== "paragraph") {
						return;
					}

					const prefix = getConventionalPrefix(
						firstNode,
						sourceText,
						options.types,
					);
					if (!prefix) {
						return;
					}

					const range = {
						begin: firstNode.position.start.offset,
						end: firstNode.position.start.offset + prefix.length,
					};

					context.report({
						fix: { range, text: "" },
						message: "conventionalPrefix",
						range,
					});
				},
			},
		};
	},
});
