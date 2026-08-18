import assert from "node:assert/strict";

import { describe, expect, it, vi } from "vitest";

import {
	createLanguage,
	RuleCreator,
	type LanguageReports,
} from "@flint.fyi/core";

import {
	RuleTester,
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
});

function createTestSetup({
	assertNoLanguageReports,
	getLanguageReports,
}: {
	assertNoLanguageReports?: boolean;
	getLanguageReports?: () => LanguageReports;
}): () => Promise<void> {
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
		setup: () => ({}),
	});

	new RuleTester({
		...(assertNoLanguageReports === undefined
			? {}
			: { assertNoLanguageReports }),
		describe: runDescribe,
		it: collectTest,
		only: collectTest,
		skip: collectTest,
	}).describe(rule, { invalid: [], valid: [""] });

	const testSetup = testSetups[0];
	assert.ok(testSetup);
	return testSetup;
}
