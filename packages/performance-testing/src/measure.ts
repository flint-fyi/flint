import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { table } from "console-table-without-index";

import { calculateDelta } from "./calculateDelta.ts";
import { createTestCaseSlug } from "./createTestCaseSlug.ts";
import { countCaseFiles } from "./creators/createCaseFiles.ts";
import { ruleCounts } from "./creators/files/rules.ts";
import { formatMemory, formatTime } from "./formatMeasurement.ts";
import { nativeScenarios } from "./nativeScenarios.ts";
import { runInHyperfine } from "./runInHyperfine.ts";
import {
	baselineFlintPath,
	baselineTestCasesPath,
	testCaseEntries,
	testCasesPath,
} from "./testCases.ts";

const eslintCommand = `node ${path.resolve(
	path.dirname(fileURLToPath(import.meta.resolve("eslint"))),
	"../bin/eslint.js",
)}`;

// --cache-ignore stops Hyperfine's repeated runs from measuring a warm Flint
// cache against ESLint runs that have none.
const flintArguments =
	"--cache-ignore --skip-formatting --skip-language-reports";

async function getFlintCommand(casesPath: string): Promise<string> {
	const packagePath = path.resolve(casesPath, "node_modules/flint");
	const { bin } = JSON.parse(
		await fs.readFile(path.join(packagePath, "package.json"), "utf8"),
	) as { bin: { flint: string } };

	return `node ${path.join(packagePath, bin.flint)}`;
}

const flintCommand = await getFlintCommand(testCasesPath);
const baselineFlintCommand =
	baselineFlintPath && (await getFlintCommand(baselineTestCasesPath));

const results: unknown[] = [];

// Measurements run one at a time: linters sharing the machine would
// contend for CPU and report times that say nothing about either.
for (const files of testCaseEntries[0].values) {
	for (const rules of testCaseEntries[1].values) {
		const testCase = { files, rules };
		const testCaseSlug = createTestCaseSlug(testCase);
		const directory = path.join(testCasesPath, testCaseSlug);
		// flint-disable-next-line performance/loopAwaits
		const eslint = await runInHyperfine(eslintCommand, "ESLint", directory);
		const baseline = baselineFlintCommand
			? // flint-disable-next-line performance/loopAwaits
				await runInHyperfine(
					`${baselineFlintCommand} ${flintArguments}`,
					"Flint baseline",
					path.join(baselineTestCasesPath, testCaseSlug),
				)
			: undefined;
		// flint-disable-next-line performance/loopAwaits
		const flint = await runInHyperfine(
			`${flintCommand} ${flintArguments}`,
			"Flint",
			directory,
		);

		/* eslint-disable perfectionist/sort-objects */
		results.push({
			files: countCaseFiles(testCase),
			rules: ruleCounts[rules],
			"eslint time": formatTime(eslint.time),
			...(baseline && { "baseline time": formatTime(baseline.time) }),
			"flint time": formatTime(flint.time),
			"Δ vs eslint": calculateDelta(eslint.time.mean, flint.time.mean),
			...(baseline && {
				"Δ vs baseline": calculateDelta(baseline.time.mean, flint.time.mean),
			}),
			...(eslint.memory && { "eslint memory": formatMemory(eslint.memory) }),
			...(baseline?.memory && {
				"baseline memory": formatMemory(baseline.memory),
			}),
			...(flint.memory && { "flint memory": formatMemory(flint.memory) }),
		});
		/* eslint-enable perfectionist/sort-objects */
	}
}

console.table(table(results));

const nativeResults: unknown[] = [];

for (const scenario of nativeScenarios) {
	const command = scenario.useCache
		? `${flintCommand} --skip-formatting --skip-language-reports --cache-location .flint-benchmark-cache`
		: `${flintCommand} ${flintArguments}`;
	// flint-disable-next-line performance/loopAwaits
	const { memory, time } = await runInHyperfine(
		command,
		"Flint native",
		path.join(testCasesPath, `native-${scenario.slug}`),
		scenario.prepare?.replaceAll("{{flint}}", flintCommand),
	);

	nativeResults.push({
		scenario: scenario.label,
		time: formatTime(time),
		...(memory && { memory: formatMemory(memory) }),
	});
}

console.table(table(nativeResults));
