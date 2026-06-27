import path from "node:path";
import { fileURLToPath } from "node:url";

import { table } from "console-table-without-index";

import { ruleCounts } from "./creators/files/rules.ts";
import { runInHyperfine } from "./runInHyperfine.ts";
import { testCaseEntries } from "./testCases.ts";
import { createTestCaseSlug } from "./utils.ts";

const results: unknown[] = [];

const flintIndex = fileURLToPath(import.meta.resolve("flint"));
const rootPath = flintIndex.replace(/packages([\\/])flint.+/g, "");

for (const files of testCaseEntries[0].values) {
	for (const rules of testCaseEntries[1].values) {
		const testCase = { files, rules };
		const testCaseSlug = createTestCaseSlug(testCase);

		results.push({
			...testCase,
			eslint: await runInHyperfine(
				`node ${path.join(rootPath, "node_modules/eslint/bin/eslint.js")}`,
				"ESLint",
				testCaseSlug,
			),
			flint: await runInHyperfine(
				`node ${path.join(rootPath, "packages/flint/bin/index.js")} --skip-formatting --skip-language-reports`,
				"Flint",
				testCaseSlug,
			),
			rules: ruleCounts[rules],
		});
	}
}

console.table(table(results));
