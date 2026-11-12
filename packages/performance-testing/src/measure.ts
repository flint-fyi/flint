import { createRequire } from "node:module";
import path from "node:path";

import { table } from "console-table-without-index";

import { calculateDelta } from "./calculateDelta.ts";
import { createTestCaseSlug } from "./createTestCaseSlug.ts";
import { countCaseFiles } from "./creators/createCaseFiles.ts";
import { ruleCounts } from "./creators/files/rules.ts";
import { nativeCacheLocation, nativeScenarios } from "./nativeScenarios.ts";
import { resolveLinterCommand } from "./resolveLinterCommand.ts";
import { runInHyperfine } from "./runInHyperfine.ts";
import {
	baselineFlintPath,
	baselineTestCasesPath,
	testCaseEntries,
	testCasesPath,
} from "./testCases.ts";

function createCasesRequire(casesPath: string): NodeJS.Require {
	return createRequire(path.resolve(casesPath, "package.json"));
}

async function resolveFlintCommand(casesPath: string): Promise<string> {
	return await resolveLinterCommand(
		"flint",
		createCasesRequire(casesPath).resolve("flint/package.json"),
	);
}

const require = createCasesRequire(testCasesPath);
const eslintCommand = await resolveLinterCommand(
	"eslint",
	require.resolve("eslint/package.json"),
);

const flintArguments = "--skip-formatting --skip-language-reports";

// --cache-ignore stops Hyperfine's repeated runs from measuring a warm Flint
// cache against ESLint runs that have none.
const uncachedFlintArguments = `--cache-ignore ${flintArguments}`;

const flintCommand = await resolveFlintCommand(testCasesPath);
const baselineFlintCommand =
	baselineFlintPath && (await resolveFlintCommand(baselineTestCasesPath));

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
					`${baselineFlintCommand} ${uncachedFlintArguments}`,
					"Flint baseline",
					path.join(baselineTestCasesPath, testCaseSlug),
				)
			: undefined;
		// flint-disable-next-line performance/loopAwaits
		const flint = await runInHyperfine(
			`${flintCommand} ${uncachedFlintArguments}`,
			"Flint",
			directory,
		);

		/* eslint-disable perfectionist/sort-objects */
		results.push({
			files: countCaseFiles(testCase),
			rules: ruleCounts[rules],
			"ESLint time": eslint.time,
			...(baseline && { "baseline time": baseline.time }),
			"Flint time": flint.time,
			"time delta vs ESLint": calculateDelta(
				eslint.meanSeconds,
				flint.meanSeconds,
			),
			...(baseline && {
				"time delta vs baseline": calculateDelta(
					baseline.meanSeconds,
					flint.meanSeconds,
				),
			}),
			"ESLint peak RSS": eslint.memory,
			...(baseline && { "baseline peak RSS": baseline.memory }),
			"Flint peak RSS": flint.memory,
		});
		/* eslint-enable perfectionist/sort-objects */
	}
}

console.table(table(results));

const cachedFlintCommand = `${flintCommand} --cache-location ${nativeCacheLocation} ${flintArguments}`;
const nativeResults: unknown[] = [];

for (const scenario of nativeScenarios) {
	// flint-disable-next-line performance/loopAwaits
	const { memory, time } = await runInHyperfine(
		scenario.prepare
			? cachedFlintCommand
			: `${flintCommand} ${uncachedFlintArguments}`,
		"Flint native",
		path.join(testCasesPath, `native-${scenario.slug}`),
		scenario.prepare?.(cachedFlintCommand),
	);

	/* eslint-disable perfectionist/sort-objects */
	nativeResults.push({
		scenario: scenario.label,
		time,
		"peak RSS": memory,
	});
	/* eslint-enable perfectionist/sort-objects */
}

console.table(table(nativeResults));
