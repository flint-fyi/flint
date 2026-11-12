export const testCasesPath = "cases";

/**
 * A second Flint checkout, with its own packed artifacts, to measure
 * alongside this one: typically the main branch.
 */
export const baselineFlintPath: string | undefined =
	process.env.FLINT_BASELINE_PATH;

export const baselineTestCasesPath = "cases-baseline";

export const testCaseEntries = [
	{
		label: "files",
		values: [2, 128, 1024, 4096, 8192],
	},
	{
		label: "rules",
		values: [1, "common", "many"],
	},
] as const;

export interface TestCase {
	files: number;
	rules: TestCaseRules;
}

export type TestCaseRules = (typeof testCaseEntries)[1]["values"][number];
