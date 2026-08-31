import assert from "node:assert/strict";

import { describe, expect, it, vi } from "vitest";

import {
	createLanguage,
	RuleCreator,
	type FileAboutData,
	type LanguageReports,
} from "@flint.fyi/core";

import {
	RuleTester,
	type TesterSetupDescribe,
	type TesterSetupIt,
} from "./RuleTester.ts";

describe(RuleTester, () => {
	it("disposes cached language factories once after all tests", async () => {
		const afterAllSetups: (() => void)[] = [];
		const dispose = vi.fn();
		const { createFileFactory, run } = createTestSetup({
			afterAll: (setup) => afterAllSetups.push(setup),
			factoryDispose: dispose,
		});

		await run();
		expect(afterAllSetups).toHaveLength(1);
		afterAllSetups[0]?.();
		afterAllSetups[0]?.();

		expect(createFileFactory).toHaveBeenCalledOnce();
		expect(dispose).toHaveBeenCalledOnce();
	});

	it("asserts that test cases contain no language reports by default", async () => {
		const getLanguageReports = vi.fn(() => [
			{ text: "A language report." },
			{ text: "Another language report." },
		]);

		await expect(createTestSetup({ getLanguageReports }).run()).rejects.toThrow(
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
			}).run(),
		).resolves.toBeUndefined();
		expect(getLanguageReports).not.toHaveBeenCalled();
	});

	it("allows languages without language reports", async () => {
		await expect(createTestSetup({}).run()).resolves.toBeUndefined();
	});
});

function createTestSetup({
	afterAll,
	assertNoLanguageReports,
	factoryDispose,
	getLanguageReports,
}: {
	afterAll?: (setup: () => void) => void;
	assertNoLanguageReports?: boolean;
	factoryDispose?: () => void;
	getLanguageReports?: () => LanguageReports;
}): {
	createFileFactory: ReturnType<typeof vi.fn>;
	run: () => Promise<void>;
} {
	const testSetups: (() => Promise<void>)[] = [];
	const collectTest: TesterSetupIt = (_description, setup): void => {
		testSetups.push(setup);
	};
	const runDescribe: TesterSetupDescribe = (_description, setup): void => {
		setup();
	};
	const createFileFactory = vi.fn(() => ({
		createFile: (about: FileAboutData) => ({ about, services: {} }),
		...(factoryDispose && { [Symbol.dispose]: factoryDispose }),
	}));
	const language = createLanguage({
		about: { name: "Test" },
		createFileFactory,
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
		...(afterAll && { afterAll }),
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
	return { createFileFactory, run: testSetup };
}
