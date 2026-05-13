import {
	applyChangesToText,
	type FileReportWithFix,
	type NormalizedReport,
} from "@flint.fyi/core";

import type { TestCaseNormalized } from "./normalizeTestCase.ts";
import type { InvalidTestCase } from "./types.ts";

export function createOutput(
	reports: NormalizedReport[],
	testCaseNormalized: InvalidTestCase & TestCaseNormalized,
) {
	const changes = reports
		.filter((report): report is FileReportWithFix => report.fix !== undefined)
		.flatMap((report) => report.fix);

	return changes.length
		? applyChangesToText(changes, testCaseNormalized.code)
		: undefined;
}
