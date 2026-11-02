export interface CodeTestCase {
	code: string;
	files?: Record<string, string> | undefined;
}

export interface FilesTestCase {
	code?: never;
	files: Record<string, string>;
}

export type InvalidTestCase<
	Options extends object | undefined = object | undefined,
> = TestCase<Options> & {
	output?: Record<string, string> | string;
	snapshot: Record<string, string> | string;
	suggestions?: TestSuggestion[];
};

export type TestCase<Options extends object | undefined = object | undefined> =
	(CodeTestCase | FilesTestCase) & TestCaseBase<Options>;

export interface TestCaseBase<
	Options extends object | undefined = object | undefined,
> {
	name?: string | undefined;

	/**
	 * Run only this test case. Useful for debugging.
	 *
	 * Do not commit code with this flag set.
	 */
	only?: boolean;

	options?: Options | undefined;

	/**
	 * Skip running this test case. Useful for work-in-progress tests.
	 *
	 * Do not commit code with this flag set.
	 */
	skip?: boolean;
}

export type TestSuggestion = TestSuggestionForFile | TestSuggestionForFiles;

export interface TestSuggestionFileCase {
	original: string;
	updated: string;
}

export interface TestSuggestionForFile {
	id: string;
	updated: string;
}

export interface TestSuggestionForFiles {
	/**
	 * Expected edits keyed by paths relative to the test host's cwd, or absolute paths.
	 * Rules must report the corresponding absolute target paths.
	 */
	files: Record<string, TestSuggestionFileCase[]>;
	id: string;
}

export type ValidTestCase<Options extends object | undefined> =
	string | ValidTestCaseObject<Options>;

export type ValidTestCaseObject<Options extends object | undefined> =
	TestCase<Options>;
