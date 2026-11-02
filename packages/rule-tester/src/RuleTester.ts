import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";

import { CachedFactory } from "cached-factory";
import { resolve } from "pathe";

import {
	createEphemeralLinterHost,
	createVFSLinterHost,
	parseOptions,
	withRepositoryRoot,
	type AnyLanguage,
	type AnyLanguageFileFactory,
	type AnyOptionalSchema,
	type AnyRule,
	type InferredInputObject,
	type LanguageReports,
	type RuleAbout,
	type VFSLinterHost,
} from "@flint.fyi/core";
import {
	createDiskBackedLinterHost,
	isFileSystemCaseSensitive,
} from "@flint.fyi/core/node";

import { createOutput } from "./createOutput.ts";
import { createReportSnapshot } from "./createReportSnapshot.ts";
import {
	normalizeTestCase,
	type TestCaseNormalized,
} from "./normalizeTestCase.ts";
import { resolveReportedSuggestions } from "./resolveReportedSuggestions.ts";
import { runTestCaseRule, type TestCaseReport } from "./runTestCaseRule.ts";
import type { InvalidTestCase, ValidTestCase } from "./types.ts";

export interface RuleTesterDefaults {
	fileName?: string;
	files?: Record<string, string>;
}

export interface RuleTesterOptions {
	assertNoLanguageReports?: boolean;
	defaults?: RuleTesterDefaults;
	describe?: TesterSetupDescribe;
	diskBackedFSRoot?: string;
	it?: TesterSetupIt;
	only?: TesterSetupIt;
	scope?: Record<string, unknown>;
	skip?: TesterSetupIt;
}

export interface TestCases<Options extends object | undefined> {
	invalid: InvalidTestCase<Options>[];
	valid: ValidTestCase<Options>[];
}

export type TesterSetupDescribe = (
	description: string,
	setup: () => void,
) => void;

export type TesterSetupIt = (
	description: string,
	setup: () => Promise<void>,
) => void;

type TestCaseUniqueProperties = Pick<
	TestCaseNormalized,
	"auxiliaryFiles" | "lintedFiles" | "options"
>;

export class RuleTester {
	#fileFactories: CachedFactory<AnyLanguage, AnyLanguageFileFactory>;
	#linterHost: VFSLinterHost;
	#testerOptions: Required<Omit<RuleTesterOptions, "diskBackedFSRoot">>;

	constructor({
		assertNoLanguageReports = true,
		defaults = {},
		describe,
		diskBackedFSRoot,
		it,
		only,
		scope = globalThis,
		skip,
	}: RuleTesterOptions = {}) {
		let host: VFSLinterHost;
		if (diskBackedFSRoot === undefined) {
			host = createVFSLinterHost({
				caseSensitive: isFileSystemCaseSensitive(),
				cwd: "/",
			});
		} else {
			const cwd = resolve(
				process.cwd(),
				diskBackedFSRoot,
				"_flint-rule-tester-virtual",
			);
			host = createVFSLinterHost({
				baseHost: createEphemeralLinterHost(
					withRepositoryRoot(createDiskBackedLinterHost(cwd), cwd),
				),
			});
		}

		const { files: defaultFiles = {} } = defaults;
		if (Object.keys(defaultFiles).length) {
			for (const [name, content] of Object.entries(defaultFiles)) {
				const filePath = resolve(host.getCurrentDirectory(), name);
				host.vfsUpsertFile(filePath, content);
			}
			// Keep per-test-case files from overwriting the defaults.
			host = createVFSLinterHost({ baseHost: host });
		}
		this.#linterHost = host;
		this.#fileFactories = new CachedFactory((language: AnyLanguage) =>
			language.createFileFactory(this.#linterHost),
		);

		it = defaultTo(it, scope, "it");

		if (!skip && "skip" in it && typeof it.skip === "function") {
			skip = it.skip as TesterSetupIt;
		}
		if (!only && "only" in it && typeof it.only === "function") {
			only = it.only as TesterSetupIt;
		}
		if (!skip) {
			throw new TypeError("RuleTester needs a `skip` function");
		}
		if (!only) {
			throw new TypeError("RuleTester needs a `only` function");
		}

		this.#testerOptions = {
			assertNoLanguageReports,
			defaults,
			describe: defaultTo(describe, scope, "describe"),
			it,
			only,
			scope,
			skip,
		};
	}

	describe<OptionsSchema extends AnyOptionalSchema | undefined>(
		rule: AnyRule<RuleAbout, OptionsSchema>,
		{ invalid, valid }: TestCases<InferredInputObject<OptionsSchema>>,
	): void {
		this.#testerOptions.describe(rule.about.id, () => {
			if (invalid.length) {
				this.#testerOptions.describe("invalid", () => {
					const seenTestCases: TestCaseUniqueProperties[] = [];
					for (const testCase of invalid) {
						this.#itInvalidCase(rule, testCase, seenTestCases);
					}
				});
			}

			if (valid.length) {
				this.#testerOptions.describe("valid", () => {
					const seenTestCases: TestCaseUniqueProperties[] = [];
					for (const testCase of valid) {
						this.#itValidCase(rule, testCase, seenTestCases);
					}
				});
			}
		});
	}

	#itInvalidCase<OptionsSchema extends AnyOptionalSchema | undefined>(
		rule: AnyRule<RuleAbout, OptionsSchema>,
		testCase: InvalidTestCase<InferredInputObject<OptionsSchema>>,
		seenTestCases: TestCaseUniqueProperties[],
	) {
		const testCaseNormalized = normalizeTestCase(
			testCase,
			this.#testerOptions.defaults.fileName,
		);

		this.#itTestCase(testCaseNormalized, seenTestCases, async () => {
			const { languageReports, reports } = await runTestCaseRule(
				this.#fileFactories,
				this.#linterHost,
				{ options: parseOptions(rule.options, testCase.options), rule },
				testCaseNormalized,
				{
					collectLanguageReports: this.#testerOptions.assertNoLanguageReports,
				},
			);
			assertNoLanguageReports(languageReports);
			const actualSnapshot = createTestCaseSnapshot(
				testCaseNormalized,
				reports,
			);

			assert.deepStrictEqual(actualSnapshot, testCase.snapshot);
			assert.ok(
				typeof testCase.output !== "string" ||
					Object.keys(testCaseNormalized.lintedFiles).length === 1,
				"Test cases with multiple linted files must use an output object keyed by file path.",
			);

			const actualOutput = createOutput(reports, testCaseNormalized);

			assert.deepStrictEqual(
				actualOutput,
				testCase.output,
				"Expected `output` property to equal:",
			);

			const actualSuggestions = resolveReportedSuggestions(
				reports,
				testCaseNormalized,
				this.#linterHost.getCurrentDirectory(),
			);
			assert.deepStrictEqual(actualSuggestions, testCase.suggestions);
		});
	}

	#itTestCase(
		testCase: TestCaseNormalized,
		seenTestCases: TestCaseUniqueProperties[],
		setup: () => Promise<void>,
	) {
		let test = testCase.only
			? this.#testerOptions.only
			: this.#testerOptions.it;

		if (testCase.skip) {
			test =
				"skip" in test && typeof test.skip === "function"
					? (test.skip as TesterSetupIt)
					: this.#testerOptions.skip;
		}

		test(
			testCase.name ??
				(testCase.code !== undefined && testCase.files === undefined
					? testCase.code
					: JSON.stringify(
							{ ...testCase.auxiliaryFiles, ...testCase.lintedFiles },
							null,
							2,
						)),
			() => {
				assertNoDuplicateTestCase(testCase, seenTestCases);
				assert.notEqual(
					Object.keys(testCase.lintedFiles).length,
					0,
					`'files' must have at least one file`,
				);
				if (testCase.files != null) {
					assert.notEqual(
						Object.keys(testCase.files).length,
						0,
						`'files' must have at least one file`,
					);
				}
				return setup();
			},
		);
	}

	#itValidCase<OptionsSchema extends AnyOptionalSchema | undefined>(
		rule: AnyRule<RuleAbout, OptionsSchema>,
		testCaseRaw: ValidTestCase<InferredInputObject<OptionsSchema>>,
		seenTestCases: TestCaseUniqueProperties[],
	) {
		const testCase =
			typeof testCaseRaw === "string" ? { code: testCaseRaw } : testCaseRaw;
		const testCaseNormalized = normalizeTestCase(
			testCase,
			this.#testerOptions.defaults.fileName,
		);

		this.#itTestCase(testCaseNormalized, seenTestCases, async () => {
			const { languageReports, reports } = await runTestCaseRule(
				this.#fileFactories,
				this.#linterHost,
				{ options: parseOptions(rule.options, testCase.options), rule },
				testCaseNormalized,
				{
					collectLanguageReports: this.#testerOptions.assertNoLanguageReports,
				},
			);
			assertNoLanguageReports(languageReports);

			for (const [fileName, code] of Object.entries(
				testCaseNormalized.lintedFiles,
			)) {
				const fileReports = reports.filter(
					(report) => report.fileName === fileName,
				);
				if (fileReports.length) {
					assert.deepStrictEqual(createReportSnapshot(code, fileReports), code);
				}
			}
		});
	}
}

function assertNoDuplicateTestCase(
	testCase: TestCaseNormalized,
	seenTestCases: TestCaseUniqueProperties[],
): void {
	const duplicateProperties = {
		auxiliaryFiles: testCase.auxiliaryFiles,
		lintedFiles: testCase.lintedFiles,
		options: testCase.options,
	} satisfies TestCaseUniqueProperties;

	if (
		seenTestCases.some((seenTestCase) =>
			isDeepStrictEqual(seenTestCase, duplicateProperties),
		)
	) {
		assert.fail(
			"Expected no duplicate test cases, but an earlier test case has the same linted files, auxiliary files, and options.",
		);
	}

	seenTestCases.push(duplicateProperties);
}

function assertNoLanguageReports(languageReports: LanguageReports) {
	// TODO (#2842): Surface each report's structured source
	if (languageReports.length) {
		assert.fail(
			[
				`Expected no language reports, but found ${languageReports.length}:`,
				...languageReports.map((languageReport) => languageReport.text),
			].join("\n\n"),
		);
	}
}

function createTestCaseSnapshot(
	testCase: InvalidTestCase & TestCaseNormalized,
	reports: TestCaseReport[],
): Record<string, string> | string {
	const files = Object.entries(testCase.lintedFiles);
	if (typeof testCase.snapshot === "string") {
		assert.equal(
			files.length,
			1,
			"Test cases with multiple linted files must use a snapshot object keyed by file path.",
		);
		const file = files[0];
		assert.ok(file);
		return createReportSnapshot(file[1], reports);
	}
	return Object.fromEntries(
		files.flatMap(([fileName, code]) => {
			const fileReports = reports.filter(
				(report) => report.fileName === fileName,
			);
			return fileReports.length
				? [[fileName, createReportSnapshot(code, fileReports)]]
				: [];
		}),
	);
}

function defaultTo<TesterSetup extends TesterSetupDescribe | TesterSetupIt>(
	provided: TesterSetup | undefined,
	scope: Record<string, unknown>,
	scopeKey: string,
): TesterSetup {
	if (provided) {
		return provided;
	}

	if (scopeKey in scope && typeof scope[scopeKey] === "function") {
		return scope[scopeKey] as TesterSetup;
	}

	throw new Error(`No ${scopeKey} function found`);
}
