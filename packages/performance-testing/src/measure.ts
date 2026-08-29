import path from "node:path";
import { fileURLToPath } from "node:url";

import { table } from "console-table-without-index";

import { calculateDelta } from "./calculateDelta.ts";
import { createTestCaseSlug } from "./createTestCaseSlug.ts";
import { countCaseFiles } from "./creators/createCaseFiles.ts";
import { ruleCounts } from "./creators/files/rules.ts";
import { runInHyperfine } from "./runInHyperfine.ts";
import { testCaseEntries, testCasesPath } from "./testCases.ts";

const results: unknown[] = [];

const eslintCommand = `node ${path.resolve(
	path.dirname(fileURLToPath(import.meta.resolve("eslint"))),
	"../bin/eslint.js",
)}`;

// --cache-ignore stops Hyperfine's repeated runs from measuring a warm Flint
// cache against ESLint runs that have none.
const flintCommand = `node ${path.resolve(testCasesPath, "node_modules/flint/bin/index.js")} --cache-ignore --skip-formatting --skip-language-reports`;

for (const files of testCaseEntries[0].values) {
	for (const rules of testCaseEntries[1].values) {
		const testCase = { files, rules };
		const testCaseSlug = createTestCaseSlug(testCase);
		// flint-disable-next-line performance/loopAwaits
		const eslint = await runInHyperfine(eslintCommand, "ESLint", testCaseSlug);
		// flint-disable-next-line performance/loopAwaits
		const flint = await runInHyperfine(flintCommand, "Flint", testCaseSlug);

		// Measurements run one at a time: linters sharing the machine would
		// contend for CPU and report times that say nothing about either.
		/* eslint-disable perfectionist/sort-objects */
		results.push({
			eslint,
			flint,
			files: countCaseFiles(testCase),
			rules: ruleCounts[rules],
			delta: calculateDelta(eslint, flint),
		});
		/* eslint-enable perfectionist/sort-objects */
	}
}

console.table(table(results));
