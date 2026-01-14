import {
	type AnyLanguage,
	type AnyLanguageFileFactory,
	type AnyOptionalSchema,
	type AnyRule,
	type InferredInputObject,
	parseOptions,
	type RuleAbout,
} from "@flint.fyi/core";
import { CachedFactory } from "cached-factory";
import assert from "node:assert/strict";

import { createReportSnapshot } from "./createReportSnapshot.ts";
import { normalizeTestCase } from "./normalizeTestCase.ts";
import { resolveReportedSuggestions } from "./resolveReportedSuggestions.ts";
import { runTestCaseRule } from "./runTestCaseRule.ts";
import type { InvalidTestCase, TestCase, ValidTestCase } from "./types.ts";

export interface RuleTesterOptions {
	defaults?: {
		fileName?: string;
	};
	describe?: TesterSetupDescribe;
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
	#testerOptions: Required<RuleTesterOptions>;

	constructor({
		defaults,
		describe,
		it,
		only,
		scope = globalThis,
		skip,
	}: RuleTesterOptions = {}) {
		this.#fileFactories = new CachedFactory((language: AnyLanguage) =>
			language.createFileFactory(),
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
			defaults: defaults ?? {},
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
				{ options: parseOptions(rule.options, testCase.options), rule },
				testCaseNormalized,
			);
			const actualSnapshot = createReportSnapshot(testCase.code, reports);

			assert.equal(actualSnapshot, testCase.snapshot);

			const actualSuggestions = resolveReportedSuggestions(
				reports,
				testCaseNormalized,
			);
			assert.deepStrictEqual(actualSuggestions, testCase.suggestions);
		});
	}

	#itTestCase(testCase: TestCase, setup: () => Promise<void>) {
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

		test(testCase.code, setup);
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
