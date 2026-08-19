import path from "node:path";
import { fileURLToPath } from "node:url";

import { table } from "console-table-without-index";

import { countCaseFiles } from "./creators/createCaseFiles.ts";
import { ruleCounts } from "./creators/files/rules.ts";
import { runInHyperfine } from "./runInHyperfine.ts";
import { testCaseEntries } from "./testCases.ts";
import { createTestCaseSlug } from "./utils.ts";

const results: unknown[] = [];

const flintIndex = fileURLToPath(import.meta.resolve("flint"));
const rootPath = flintIndex.replace(/packages[\\/]flint.+/g, "");

// --cache-ignore stops Hyperfine's repeated runs from measuring a warm Flint
// cache against ESLint runs that have none.
const eslintCommand = `node ${path.join(rootPath, "node_modules/eslint/bin/eslint.js")}`;
const flintCommand = `node ${path.join(rootPath, "packages/flint/bin/index.js")} --cache-ignore --skip-formatting --skip-language-reports`;

for (const files of testCaseEntries[0].values) {
	for (const rules of testCaseEntries[1].values) {
		const testCase = { files, rules };
		const testCaseSlug = createTestCaseSlug(testCase);

		results.push({
			eslint: await runInHyperfine(eslintCommand, "ESLint", testCaseSlug),
			files: countCaseFiles(testCase),
			flint: await runInHyperfine(flintCommand, "Flint", testCaseSlug),
			rules: ruleCounts[rules],
		});
	}
}

console.table(table(results));
