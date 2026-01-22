import {
	type AnyLanguage,
	type AnyLanguageFileFactory,
	type AnyOptionalSchema,
	type AnyRule,
	createDiskBackedLinterHost,
	createEphemeralLinterHost,
	createVFSLinterHost,
	type InferredInputObject,
	parseOptions,
	type RuleAbout,
	type VFSLinterHost,
} from "@flint.fyi/core";
import { CachedFactory } from "cached-factory";
import assert from "node:assert/strict";
import path from "node:path";

import { createOutput } from "./createOutput.ts";
import { createReportSnapshot } from "./createReportSnapshot.ts";
import {
	normalizeTestCase,
	type TestCaseNormalized,
} from "./normalizeTestCase.ts";
import { resolveReportedSuggestions } from "./resolveReportedSuggestions.ts";
import { runTestCaseRule } from "./runTestCaseRule.ts";
import type { InvalidTestCase, ValidTestCase } from "./types.ts";

export interface RuleTesterDefaults {
	fileName?: string;
	files?: Record<string, string>;
}
export interface RuleTesterOptions {
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

export class RuleTester {
	#fileFactories: CachedFactory<AnyLanguage, AnyLanguageFileFactory>;
	#linterHost: VFSLinterHost;
	#testerOptions: Required<Omit<RuleTesterOptions, "diskBackedFSRoot">>;

	constructor({
		defaults = {},
		describe,
		diskBackedFSRoot,
		it,
		only,
		scope = globalThis,
		skip,
	}: RuleTesterOptions = {}) {
		let baseHost =
			diskBackedFSRoot != null
				? createEphemeralLinterHost(
						createDiskBackedLinterHost(
							path.resolve(
								process.cwd(),
								diskBackedFSRoot,
								"_flint-rule-tester-virtual",
							),
						),
					)
				: undefined;
		const { files: defaultFiles = {} } = defaults;
		if (Object.keys(defaultFiles).length > 0) {
			const vfs = createVFSLinterHost(
				baseHost == null ? { cwd: process.cwd() } : { baseHost },
			);
			for (const [name, content] of Object.entries(defaultFiles)) {
				const filePath = path.resolve(vfs.getCurrentDirectory(), name);
				vfs.vfsUpsertFile(filePath, content);
			}
			baseHost = vfs;
		}
		// another overlay to prevent `defaultFiles` from being overwritten
		// by per-test-case `files`
		this.#linterHost = createVFSLinterHost(
			baseHost == null ? { cwd: process.cwd() } : { baseHost },
		);
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
	) {
		this.#testerOptions.describe(rule.about.id, () => {
			this.#testerOptions.describe("invalid", () => {
				for (const testCase of invalid) {
					this.#itInvalidCase(rule, testCase);
				}
			});

			this.#testerOptions.describe("valid", () => {
				for (const testCase of valid) {
					this.#itValidCase(rule, testCase);
				}
			});
		});
	}

	#itInvalidCase<OptionsSchema extends AnyOptionalSchema | undefined>(
		rule: AnyRule<RuleAbout, OptionsSchema>,
		testCase: InvalidTestCase<InferredInputObject<OptionsSchema>>,
	) {
		const testCaseNormalized = normalizeTestCase(
			testCase,
			this.#testerOptions.defaults.fileName,
		);

		this.#itTestCase(testCaseNormalized, async () => {
			const reports = await runTestCaseRule(
				this.#fileFactories,
				this.#linterHost,
				{ options: parseOptions(rule.options, testCase.options), rule },
				testCaseNormalized,
			);
			const actualSnapshot = createReportSnapshot(testCase.code, reports);

			assert.equal(actualSnapshot, testCase.snapshot);

			const actualOutput = createOutput(reports, testCaseNormalized);

			assert.equal(
				testCase.output,
				actualOutput,
				"Expected `output` property to equal:",
			);

			const actualSuggestions = resolveReportedSuggestions(
				reports,
				testCaseNormalized,
			);
			assert.deepStrictEqual(actualSuggestions, testCase.suggestions);
		});
	}

	#itTestCase(testCase: TestCaseNormalized, setup: () => Promise<void>) {
		let test = testCase.only
			? this.#testerOptions.only
			: this.#testerOptions.it;

		if (testCase.skip) {
			if ("skip" in test && typeof test.skip === "function") {
				test = test.skip as TesterSetupIt;
			} else {
				test = this.#testerOptions.skip;
			}
		}

		test(
			"files" in testCase
				? JSON.stringify(
						{ [testCase.fileName]: testCase.code, ...testCase.files },
						null,
						2,
					)
				: testCase.code,
			() => {
				if (testCase.files != null) {
					assert.notEqual(
						Object.keys(testCase.files),
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
	) {
		const testCase =
			typeof testCaseRaw === "string" ? { code: testCaseRaw } : testCaseRaw;
		const testCaseNormalized = normalizeTestCase(
			testCase,
			this.#testerOptions.defaults.fileName,
		);

		this.#itTestCase(testCaseNormalized, async () => {
			const reports = await runTestCaseRule(
				this.#fileFactories,
				this.#linterHost,
				{ options: parseOptions(rule.options, testCase.options), rule },
				testCaseNormalized,
			);

			if (reports.length) {
				assert.deepStrictEqual(
					createReportSnapshot(testCaseNormalized.code, reports),
					testCaseNormalized.code,
				);
			}
		});
	}
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
