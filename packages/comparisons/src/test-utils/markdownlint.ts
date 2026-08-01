import fs from "node:fs/promises";

import type { Rule } from "markdownlint";

import { comparisons } from "../index.ts";
import type { LinterRuleReference } from "../schemas.ts";

interface MarkdownlintModule {
	default: Rule | Rule[];
}

export async function findMarkdownlintRules(): Promise<Rule[]> {
	const markdownlintDirectory = new URL(
		".",
		import.meta.resolve("markdownlint"),
	);
	const fileNames = await fs.readdir(markdownlintDirectory);

	return (
		await Promise.all(
			fileNames
				.filter((fileName) => /md\d+\.mjs/.test(fileName))
				.map(async (fileName) => {
					const module = (await import(
						new URL(fileName, markdownlintDirectory).href
					)) as MarkdownlintModule;

					return module.default;
				}),
		)
	).flat();
}

export function findMarkdownlintRulesInFlint(): LinterRuleReference[] {
	return comparisons.flatMap((comparison) => comparison.markdownlint ?? []);
}
