import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import type { Rule } from "markdownlint";

import { comparisons } from "../index.ts";

interface MarkdownlintModule {
	default: Rule | Rule[];
}

const require = createRequire(import.meta.dirname);

export async function findMarkdownlintRules(): Promise<Rule[]> {
	const markdownlintDirectory = path.dirname(require.resolve("markdownlint"));
	const fileNames = await fs.readdir(markdownlintDirectory);

	return (
		await Promise.all(
			fileNames
				.filter((fileName) => /md\d+\.mjs/.test(fileName))
				.map(async (fileName) => {
					const module = (await import(
						path.join(markdownlintDirectory, fileName)
					)) as MarkdownlintModule;

					return module.default;
				}),
		)
	).flat();
}

export function findMarkdownlintRulesInFlint() {
	return comparisons.flatMap((comparison) => comparison.markdownlint ?? []);
}
