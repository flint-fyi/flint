export const testCasesPath = "cases";

export const testCaseEntries = [
	{
		label: "files",
		values: [2, 256, 1024 /* , 8192 */],
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
