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

const biomeCommand = `node ${path.resolve(
	path.dirname(
		fileURLToPath(import.meta.resolve("@biomejs/biome/package.json")),
	),
	"bin/biome",
)} lint src`;

const eslintCommand = `node ${path.resolve(
	path.dirname(fileURLToPath(import.meta.resolve("eslint"))),
	"../bin/eslint.js",
)}`;

// --cache-ignore stops Hyperfine's repeated runs from measuring a warm Flint
// cache against ESLint runs that have none.
const flintCommand = `node ${path.resolve(testCasesPath, "node_modules/flint/bin/index.js")} --cache-ignore --skip-formatting --skip-language-reports`;

// flint-disable-lines-begin performance/loopAwaits
for (const files of testCaseEntries[0].values) {
	for (const rules of testCaseEntries[1].values) {
		const testCase = { files, rules };
		const testCaseSlug = createTestCaseSlug(testCase);
		const biome = await runInHyperfine(biomeCommand, "Biome", testCaseSlug);
		const eslint = await runInHyperfine(eslintCommand, "ESLint", testCaseSlug);
		const flint = await runInHyperfine(flintCommand, "Flint", testCaseSlug);

		// Measurements run one at a time: linters sharing the machine would
		// contend for CPU and report times that say nothing about either.
		/* eslint-disable perfectionist/sort-objects */
		results.push({
			files: countCaseFiles(testCase),
			rules: ruleCounts[rules],
			biome,
			eslint,
			flint,
			vsBiome: calculateDelta(biome, flint),
			vsESLint: calculateDelta(eslint, flint),
		});
		/* eslint-enable perfectionist/sort-objects */
	}
}
// flint-disable-lines-end performance/loopAwaits

console.table(table(results));
