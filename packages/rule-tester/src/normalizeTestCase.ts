import type { TestCase } from "./types.ts";

export interface TestCaseNormalized extends TestCase {
	fileName: string;
}

export function normalizeTestCase<T extends TestCase>(
	testCase: T,
	fileName: string | undefined,
): T & TestCaseNormalized {
	const rv: T = {
		...testCase,
	};
	rv.fileName ??= fileName ?? "file.ts";
	return rv as typeof rv & { fileName: string };
}
