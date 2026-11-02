import type { TestCase, TestCaseBase } from "./types.ts";

export interface TestCaseNormalized extends TestCaseBase {
	auxiliaryFiles: Record<string, string>;
	code?: string;
	files?: Record<string, string> | undefined;
	lintedFiles: Record<string, string>;
}

export function normalizeTestCase<T extends TestCase>(
	testCase: T,
	fileName = "file.ts",
): T & TestCaseNormalized {
	return {
		...testCase,
		auxiliaryFiles: testCase.code === undefined ? {} : (testCase.files ?? {}),
		lintedFiles:
			testCase.code === undefined
				? testCase.files
				: { [fileName]: testCase.code },
	};
}
