import { applyChangesToText, type FileReportWithFix } from "@flint.fyi/core";

import type { TestCaseNormalized } from "./normalizeTestCase.ts";
import type { TestCaseReport } from "./runTestCaseRule.ts";
import type { InvalidTestCase } from "./types.ts";

export function createOutput(
	reports: TestCaseReport[],
	testCaseNormalized: InvalidTestCase & TestCaseNormalized,
): Record<string, string> | string | undefined {
	const outputs: [string, string][] = [];
	for (const [fileName, code] of Object.entries(
		testCaseNormalized.lintedFiles,
	)) {
		const changes = reports
			.filter(
				(report): report is FileReportWithFix & TestCaseReport =>
					report.fileName === fileName && report.fix !== undefined,
			)
			.flatMap((report) => report.fix);
		if (changes.length) {
			outputs.push([fileName, applyChangesToText(changes, code)]);
		}
	}
	if (!outputs.length) {
		return;
	}
	return Object.keys(testCaseNormalized.lintedFiles).length === 1 &&
		typeof testCaseNormalized.output !== "object"
		? outputs[0]?.[1]
		: Object.fromEntries(outputs);
}
