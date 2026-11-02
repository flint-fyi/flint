import assert from "node:assert/strict";

import { describe, expect, it, vi } from "vitest";

import {
	createLanguage,
	RuleCreator,
	type AnyLanguageFile,
	type FileAboutData,
	type LanguageReports,
	type LinterHost,
	type RuleContext,
	type RuleReport,
} from "@flint.fyi/core";

import {
	RuleTester,
	type RuleTesterOptions,
	type TestCases,
	type TesterSetupDescribe,
	type TesterSetupIt,
} from "./RuleTester.ts";

describe(RuleTester, () => {
	it.each(["invalid", "valid", "neither"] as const)(
		"registers only populated child suites when %s has cases",
		(populated) => {
			const registerDescribe = vi.fn<TesterSetupDescribe>(
				(_description, setup) => {
					setup();
				},
			);
			createTestSetups({
				testCases: {
					invalid: populated === "invalid" ? [{ code: "", snapshot: "" }] : [],
					valid: populated === "valid" ? [""] : [],
				},
				testerOptions: { describe: registerDescribe },
			});
			expect(
				registerDescribe.mock.calls.map(([description]) => description),
			).toEqual(
				populated === "neither"
					? ["languageReports"]
					: ["languageReports", populated],
			);
		},
	);

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
			"Expected no duplicate test cases, but an earlier test case has the same linted files, auxiliary files, and options.",
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
			"Expected no duplicate test cases, but an earlier test case has the same linted files, auxiliary files, and options.",
		);
	});

	it("allows test cases with the same code and different file names", async () => {
		const [first, second] = createTestSetups({
			testCases: {
				invalid: [],
				valid: ["let a;", { files: { "other.ts": "let a;" } }],
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

	it("recognizes a files-only case equivalent to a code shorthand", async () => {
		const [first, second] = createTestSetups({
			testCases: {
				invalid: [],
				valid: ["abc", { files: { "file.ts": "abc" } }],
			},
		});
		assert.ok(first);
		assert.ok(second);
		await first();
		expect(second).toThrow("Expected no duplicate test cases");
	});

	it("checks every file and applies fixes to the corresponding source", async () => {
		await expect(
			createTestSetup({
				testCases: {
					invalid: [
						{
							files: { "a.ts": "abc", "b.ts": "wxyz", "clean.ts": "clean" },
							output: { "a.ts": "Xbc", "b.ts": "wxY" },
							snapshot: { "a.ts": "abc\n~\n", "b.ts": "wxyz\n  ~~\n  " },
						},
					],
					valid: [],
				},
				visit(file, context) {
					if (file.about.filePath === "clean.ts") {
						return;
					}
					const first = file.about.filePath === "a.ts";
					const range = first ? { begin: 0, end: 1 } : { begin: 2, end: 4 };
					context.report({
						fix: { range, text: first ? "X" : "Y" },
						message: "",
						range,
					});
				},
			})(),
		).resolves.toBeUndefined();
	});

	it.each([false, true])(
		"supports a single named file with mapped expectations: %s",
		async (mapped) => {
			await expect(
				createTestSetup({
					report: {
						fix: { range: { begin: 0, end: 1 }, text: "X" },
						message: "",
						range: { begin: 0, end: 1 },
					},
					testCases: {
						invalid: [
							{
								files: { "named.ts": "abc" },
								output: mapped ? { "named.ts": "Xbc" } : "Xbc",
								snapshot: mapped ? { "named.ts": "abc\n~\n" } : "abc\n~\n",
							},
						],
						valid: [],
					},
				})(),
			).resolves.toBeUndefined();
		},
	);

	it("keeps all files available through teardown and routes its reports", async () => {
		const events: string[] = [];
		const setup = vi.fn(() => {
			events.push("setup");
		});
		const teardown = vi.fn((context: RuleContext<"">) => {
			events.push("teardown");
			context.report({
				filePath: "b.ts",
				message: "",
				range: { begin: 1, end: 3 },
			});
		});
		await expect(
			createTestSetup({
				createFile(about, host) {
					expect(host.readFileSync("/a.ts")).toBe("abc");
					expect(host.readFileSync("/b.ts")).toBe("wxyz");
					events.push(`create:${about.filePath}`);
				},
				disposeFile(about) {
					events.push(`dispose:${about.filePath}`);
				},
				orderFilePaths: (filePaths) => filePaths.toReversed(),
				setup,
				teardown,
				testCases: {
					invalid: [
						{
							files: { "a.ts": "abc", "b.ts": "wxyz" },
							snapshot: { "b.ts": "wxyz\n ~~\n " },
						},
					],
					valid: [],
				},
				visit(file) {
					events.push(`visit:${file.about.filePath}`);
				},
			})(),
		).resolves.toBeUndefined();
		expect(setup).toHaveBeenCalledOnce();
		expect(teardown).toHaveBeenCalledOnce();
		expect(events).toEqual([
			"create:b.ts",
			"create:a.ts",
			"setup",
			"visit:b.ts",
			"visit:a.ts",
			"teardown",
			"dispose:a.ts",
			"dispose:b.ts",
		]);
	});

	it("rejects reports targeting files outside the linted inputs", async () => {
		await expect(
			createTestSetup({
				report: {
					filePath: "auxiliary.ts",
					message: "",
					range: { begin: 0, end: 1 },
				},
				testCases: {
					invalid: [],
					valid: [{ code: "abc", files: { "auxiliary.ts": "abc" } }],
				},
			})(),
		).rejects.toThrow("which is not part of the current test case");
	});

	it.each(["/file.ts", "./file.ts"])(
		"rejects a report using the alias %s",
		async (filePath) => {
			await expect(
				createTestSetup({
					report: { filePath, message: "", range: { begin: 0, end: 1 } },
					testCases: { invalid: [], valid: ["abc"] },
				})(),
			).rejects.toThrow("which is not part of the current test case");
		},
	);

	it("accepts an absolute report path when it is the input file name", async () => {
		await expect(
			createTestSetup({
				report: {
					filePath: "/file.ts",
					message: "",
					range: { begin: 0, end: 1 },
				},
				testCases: {
					invalid: [{ files: { "/file.ts": "abc" }, snapshot: "abc\n~\n" }],
					valid: [],
				},
			})(),
		).resolves.toBeUndefined();
	});

	it("reports errors in a second valid input", async () => {
		await expect(
			createTestSetup({
				testCases: {
					invalid: [],
					valid: [{ files: { "a.ts": "abc", "b.ts": "xyz" } }],
				},
				visit(file, context) {
					if (file.about.filePath === "b.ts") {
						context.report({ message: "", range: { begin: 0, end: 1 } });
					}
				},
			})(),
		).rejects.toThrow();
	});

	it.each([
		{ files: { "./file.ts": "first", "file.ts": "second" } },
		{ code: "first", files: { "/file.ts": "second" } },
	])("rejects file aliases: %j", async (testCase) => {
		await expect(
			createTestSetup({ testCases: { invalid: [], valid: [testCase] } })(),
		).rejects.toThrow("resolve to the same file");
	});

	it("rejects an empty files-only case", () => {
		expect(
			createTestSetup({ testCases: { invalid: [], valid: [{ files: {} }] } }),
		).toThrow("'files' must have at least one file");
	});

	it.each(["snapshot", "output"] as const)(
		"requires a mapped %s for multiple files",
		async (property) => {
			await expect(
				createTestSetup({
					report: {
						filePath: "a.ts",
						message: "",
						range: { begin: 0, end: 1 },
					},
					testCases: {
						invalid: [
							{
								files: { "a.ts": "abc", "b.ts": "xyz" },
								...(property === "output" && { output: "abc\n~\n" }),
								snapshot:
									property === "snapshot" ? "abc\n~\n" : { "a.ts": "abc\n~\n" },
							},
						],
						valid: [],
					},
				})(),
			).rejects.toThrow(`${property} object keyed by file path`);
		},
	);

	it("restores default files and removes stale files between test cases", async () => {
		const observed: (string | undefined)[][] = [];
		const [first, second] = createTestSetups({
			setup({ host }) {
				observed.push([
					host.readFileSync("/temporary.ts"),
					host.readFileSync("/config.json"),
				]);
			},
			testCases: {
				invalid: [],
				valid: [
					{
						code: "first",
						files: { "config.json": "override", "temporary.ts": "temporary" },
					},
					{ files: { "second.ts": "second" } },
				],
			},
			testerOptions: { defaults: { files: { "config.json": "default" } } },
		});
		assert.ok(first);
		assert.ok(second);
		await first();
		await second();
		expect(observed).toEqual([
			["temporary", "override"],
			[undefined, "default"],
		]);
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

	it.each([false, true])(
		"roots virtual files at / with defaults: %s",
		async (withDefaults) => {
			const getLanguageReports = vi.fn(
				(file: AnyLanguageFile, host: LinterHost) => {
					expect(host.getCurrentDirectory()).toBe("/");
					expect(file.about.filePathAbsolute).toBe("/src/file.ts");
					expect(host.readFileSync("/src/file.ts")).toBe("abc");
					expect(host.readFileSync("/dictionary.json")).toBe("case");
					expect(host.readFileSync("/default.json")).toBe(
						withDefaults ? "default" : undefined,
					);
					return [];
				},
			);
			await expect(
				createTestSetup({
					getLanguageReports,
					testCases: {
						invalid: [],
						valid: [
							{
								code: "abc",
								files: { "dictionary.json": "case" },
							},
						],
					},
					testerOptions: {
						defaults: {
							fileName: "src/file.ts",
							...(withDefaults && {
								files: {
									"default.json": "default",
									"dictionary.json": "default",
								},
							}),
						},
					},
				})(),
			).resolves.toBeUndefined();
			expect(getLanguageReports).toHaveBeenCalledOnce();
		},
	);

	it("applies absolute suggestion targets using relative expectations", async () => {
		await expect(
			createTestSetup({
				report: {
					message: "",
					range: { begin: 0, end: 1 },
					suggestions: [
						{
							files: {
								"/dictionary.json": [
									{ range: { begin: 0, end: 4 }, text: "next" },
								],
							},
							id: "dictionary",
						},
					],
				},
				testCases: {
					invalid: [
						{
							code: "abc",
							files: { "dictionary.json": "case" },
							snapshot: "abc\n~\n",
							suggestions: [
								{
									files: {
										"dictionary.json": [{ original: "case", updated: "next" }],
									},
									id: "dictionary",
								},
							],
						},
					],
					valid: [],
				},
			})(),
		).resolves.toBeUndefined();
	});
});

interface TestSetupOptions {
	assertNoLanguageReports?: boolean;
	createFile?: (about: FileAboutData, host: LinterHost) => void;
	disposeFile?: (about: FileAboutData) => void;
	getLanguageReports?: (
		file: AnyLanguageFile,
		host: LinterHost,
	) => LanguageReports;
	it?: TesterSetupIt;
	orderFilePaths?: (filePaths: readonly string[], host: LinterHost) => string[];
	report?: RuleReport<"">;
	setup?: (context: RuleContext<"">) => void;
	teardown?: (context: RuleContext<"">) => void;
	testCases?: TestCases<undefined>;
	testerOptions?: RuleTesterOptions;
	visit?: (file: AnyLanguageFile, context: RuleContext<"">) => void;
}

function createTestSetup(options: TestSetupOptions): () => Promise<void> {
	const testSetup = createTestSetups(options)[0];
	assert.ok(testSetup);
	return testSetup;
}

function createTestSetups({
	assertNoLanguageReports,
	createFile,
	disposeFile,
	getLanguageReports,
	it: registerTest,
	orderFilePaths,
	report,
	setup,
	teardown,
	testCases = { invalid: [], valid: [""] },
	testerOptions,
	visit,
}: TestSetupOptions): (() => Promise<void>)[] {
	const testSetups: (() => Promise<void>)[] = [];
	const collectTest: TesterSetupIt = (_description, setup): void => {
		testSetups.push(setup);
	};
	const runDescribe: TesterSetupDescribe = (_description, setup): void => {
		setup();
	};
	let ruleContext: RuleContext<""> | undefined;
	const language = createLanguage({
		about: { name: "Test" },
		createFileFactory: (host) => ({
			createFile: (about) => {
				createFile?.(about, host);
				return {
					about,
					services: {},
					[Symbol.dispose]: () => disposeFile?.(about),
				};
			},
		}),
		...(getLanguageReports && { getLanguageReports }),
		...(orderFilePaths && { orderFilePaths }),
		runFileVisitors: (file) => {
			assert.ok(ruleContext);
			visit?.(file, ruleContext);
		},
	});
	const rule = new RuleCreator({
		docs: () => "https://example.com",
		pluginId: "test",
		presets: [],
	}).createRule(language, {
		about: { description: "", id: "languageReports" },
		messages: { "": { primary: "", secondary: [], suggestions: [] } },
		setup: (context) => {
			ruleContext = context;
			setup?.(context);
			if (report) {
				context.report(report);
			}
			return {
				teardown: () => {
					teardown?.(context);
				},
				visitors: {},
			};
		},
	});

	new RuleTester({
		...testerOptions,
		...(assertNoLanguageReports === undefined
			? {}
			: { assertNoLanguageReports }),
		describe: testerOptions?.describe ?? runDescribe,
		it: registerTest ?? collectTest,
		only: collectTest,
		skip: collectTest,
	}).describe(rule, testCases);

	return testSetups;
}
