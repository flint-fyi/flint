import type { TestCase } from "./types.ts";

export interface TestCaseNormalized extends TestCase {
	fileName: string;
}

export function normalizeTestCase<T extends TestCase>(
	testCase: T,
	fileName = "file.ts",
): T & TestCaseNormalized {
	const rv: T = {
		...testCase,
	};
	rv.fileName ??= fileName;
	return rv as typeof rv & { fileName: string };
}
