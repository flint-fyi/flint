import assert from "node:assert/strict";

import { describe, expect, it, vi } from "vitest";

import {
	createLanguage,
	RuleCreator,
	type LanguageReports,
	type RuleReport,
} from "@flint.fyi/core";

import {
	RuleTester,
	type TestCases,
	type TesterSetupDescribe,
	type TesterSetupIt,
} from "./RuleTester.ts";

describe(RuleTester, () => {
	it("asserts that test cases contain no language reports by default", async () => {
		const getLanguageReports = vi.fn(() => [
			{ text: "A language report." },
			{ text: "Another language report." },
		]);

		await expect(createTestSetup({ getLanguageReports })()).rejects.toThrow(
			`Expected no language reports, but found 2:

A language report.

Another language report.`,
		);
		expect(getLanguageReports).toHaveBeenCalledOnce();
	});

	it("does not collect language reports when assertions are disabled", async () => {
		const getLanguageReports = vi.fn(() => [{ text: "A language report." }]);

		await expect(
			createTestSetup({
				assertNoLanguageReports: false,
				getLanguageReports,
			})(),
		).resolves.toBeUndefined();
		expect(getLanguageReports).not.toHaveBeenCalled();
	});

	it("allows languages without language reports", async () => {
		await expect(createTestSetup({})()).resolves.toBeUndefined();
	});

	it("fails a test case that duplicates an earlier test case", async () => {
		const [first, second] = createTestSetups({
			testCases: { invalid: [], valid: ["let a;", { code: "let a;" }] },
		});
		assert.ok(first);
		assert.ok(second);

		await expect(first()).resolves.toBeUndefined();
		expect(second).toThrow(
			"Expected no duplicate test cases, but an earlier test case has the same code, fileName, files, and options.",
		);
	});

	it("fails a duplicate test case whose files use different property order", async () => {
		const [first, second] = createTestSetups({
			testCases: {
				invalid: [],
				valid: [
					{ code: "let a;", files: { "a.ts": "a", "b.ts": "b" } },
					{
						code: "let a;",
						files: Object.fromEntries([
							["b.ts", "b"],
							["a.ts", "a"],
						]),
					},
				],
			},
		});
		assert.ok(first);
		assert.ok(second);

		await expect(first()).resolves.toBeUndefined();
		expect(second).toThrow(
			"Expected no duplicate test cases, but an earlier test case has the same code, fileName, files, and options.",
		);
	});

	it("allows test cases with the same code and different file names", async () => {
		const [first, second] = createTestSetups({
			testCases: {
				invalid: [],
				valid: ["let a;", { code: "let a;", fileName: "other.ts" }],
			},
		});
		assert.ok(first);
		assert.ok(second);

		await expect(first()).resolves.toBeUndefined();
		await expect(second()).resolves.toBeUndefined();
	});

	it("allows an invalid test case with the same code as a valid test case", async () => {
		const [first, second] = createTestSetups({
			testCases: {
				invalid: [{ code: "let a;", snapshot: "let a;" }],
				valid: ["let a;"],
			},
		});
		assert.ok(first);
		assert.ok(second);

		await expect(first()).resolves.toBeUndefined();
		await expect(second()).resolves.toBeUndefined();
	});

	it("rejects cross-file suggestion mismatches through the named test callback", async () => {
		const registerTest = vi.fn<TesterSetupIt>();
		createTestSetups({
			it: registerTest,
			report: {
				filePath: "file.ts",
				message: "",
				range: { begin: 0, end: 1 },
				suggestions: [{ files: { "unexpected.ts": [] }, id: "suggestion" }],
			},
			testCases: {
				invalid: [
					{
						code: "abc",
						name: "cross-file target mismatch",
						snapshot: "abc\n~\n",
						suggestions: [
							{
								files: { "expected.ts": [{ original: "abc", updated: "abc" }] },
								id: "suggestion",
							},
						],
					},
				],
				valid: [],
			},
		});

		expect(registerTest).toHaveBeenCalledExactlyOnceWith(
			"cross-file target mismatch",
			expect.any(Function),
		);
		const registeredTest = registerTest.mock.calls[0];
		assert.ok(registeredTest);
		await expect(registeredTest[1]()).rejects.toThrow(
			"Reported suggestion target paths must exactly match expected target paths.",
		);
	});
});

interface TestSetupOptions {
	assertNoLanguageReports?: boolean;
	getLanguageReports?: () => LanguageReports;
	it?: TesterSetupIt;
	report?: RuleReport<"">;
	testCases?: TestCases<undefined>;
}

function createTestSetup(options: TestSetupOptions): () => Promise<void> {
	const testSetup = createTestSetups(options)[0];
	assert.ok(testSetup);
	return testSetup;
}

function createTestSetups({
	assertNoLanguageReports,
	getLanguageReports,
	it: registerTest,
	report,
	testCases = { invalid: [], valid: [""] },
}: TestSetupOptions): (() => Promise<void>)[] {
	const testSetups: (() => Promise<void>)[] = [];
	const collectTest: TesterSetupIt = (_description, setup): void => {
		testSetups.push(setup);
	};
	const runDescribe: TesterSetupDescribe = (_description, setup): void => {
		setup();
	};
	const language = createLanguage({
		about: { name: "Test" },
		createFileFactory: () => ({
			createFile: (about) => ({ about, services: {} }),
		}),
		...(getLanguageReports && { getLanguageReports }),
		runFileVisitors: vi.fn(),
	});
	const rule = new RuleCreator({
		docs: () => "https://example.com",
		pluginId: "test",
		presets: [],
	}).createRule(language, {
		about: { description: "", id: "languageReports" },
		messages: { "": { primary: "", secondary: [], suggestions: [] } },
		setup: (context) => {
			if (report) {
				context.report(report);
			}
			return {};
		},
	});

	new RuleTester({
		...(assertNoLanguageReports === undefined
			? {}
			: { assertNoLanguageReports }),
		describe: runDescribe,
		it: registerTest ?? collectTest,
		only: collectTest,
		skip: collectTest,
	}).describe(rule, testCases);

	return testSetups;
}
