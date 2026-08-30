/* eslint-disable perfectionist/sort-maps -- Map insertion order is part of the behavior under test. */
import { describe, expect, it, vi } from "vitest";
import z from "zod/v4";

import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import type { LinterHost } from "../types/host.ts";
import type { LanguageFile } from "../types/languages.ts";
import type { AnyRule } from "../types/rules.ts";
import { runRules } from "./runRules.ts";
import type { LanguageAndFile } from "./types.ts";

const host = {} as LinterHost;

const messages = {
	message: { primary: "Message.", secondary: [], suggestions: [] },
};

const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://example.com/${ruleId}`,
	pluginId: "test",
	presets: [],
});

function createFile(
	filePath: string,
	marker: string,
	adjustReportRange?: () => null,
): LanguageFile<{ marker: string }> {
	const file = {
		about: { filePath, filePathAbsolute: filePath, sourceText: "node" },
		services: { marker },
		[Symbol.dispose]() {
			return undefined;
		},
	};

	return adjustReportRange ? { ...file, adjustReportRange } : file;
}

function createStubLanguage() {
	return createLanguage({
		about: { name: "stub" },
		createFileFactory: vi.fn(),
		runFileVisitors: vi.fn(),
	});
}

describe(runRules, () => {
	it("orders reports and shares parsed options when rules visit multiple files", async () => {
		const visited: { marker: string; options: unknown }[] = [];
		const runFileVisitors = vi.fn();
		const language = createLanguage<{ Node: string }, { marker: string }>({
			about: { name: "test" },
			createFileFactory: vi.fn(),
			runFileVisitors(file, fileVisitors) {
				runFileVisitors(file, fileVisitors);
				for (const { services, visitors } of fileVisitors) {
					visitors.Node?.(file.about.sourceText, services);
				}
			},
		});
		const firstFile = createFile("/first.ts", "first");
		const filteredFile = createFile("/filtered.ts", "filtered", () => null);
		const disabledFile = createFile("/disabled.ts", "disabled");
		const firstRule = ruleCreator.createRule(language, {
			about: { description: "", id: "first" },
			messages,
			options: { value: z.string().default("default") },
			setup(context) {
				context.report({
					filePath: firstFile.about.filePath,
					message: "message",
					range: { begin: 0, end: 1 },
				});

				return {
					teardown() {
						context.report({
							filePath: firstFile.about.filePath,
							message: "message",
							range: { begin: 0, end: 1 },
						});
						return undefined;
					},
					visitors: {
						Node(_node, services) {
							visited.push(services);
							context.report({
								message: "message",
								range: { begin: 0, end: 1 },
							});
						},
					},
				};
			},
		});
		const secondRule = ruleCreator.createRule(language, {
			about: { description: "", id: "second" },
			messages,
			setup(context) {
				return {
					visitors: {
						Node() {
							context.report({
								message: "message",
								range: { begin: 0, end: 1 },
							});
						},
					},
				};
			},
		});
		const setupOnlyRule = ruleCreator.createRule(language, {
			about: { description: "", id: "setupOnly" },
			messages,
			setup: () => undefined,
		});
		const otherLanguage = createLanguage({
			about: { name: "other" },
			createFileFactory: vi.fn(),
			runFileVisitors: vi.fn(),
		});
		const options = {};
		const languageFilesByFilePath = new Map<string, LanguageAndFile[]>([
			["/first.ts", [{ file: firstFile, language }]],
			["/filtered.ts", [{ file: filteredFile, language }]],
			["/disabled.ts", [{ file: disabledFile, language }]],
			[
				"/other.ts",
				[{ file: createFile("/other.ts", "other"), language: otherLanguage }],
			],
		]);
		const rulesOptionsByFile = new Map<AnyRule, Map<string, object>>([
			[
				firstRule,
				new Map([
					["/first.ts", options],
					["/filtered.ts", options],
				]),
			],
			[secondRule, new Map([["/first.ts", {}]])],
			[setupOnlyRule, new Map([["/first.ts", {}]])],
		]);

		const reportsByFilePath = await runRules(
			languageFilesByFilePath,
			rulesOptionsByFile,
			host,
		);

		expect(runFileVisitors).toHaveBeenCalledTimes(2);
		expect(visited).toEqual([
			{ marker: "first", options: { value: "default" } },
			{ marker: "filtered", options: { value: "default" } },
		]);
		expect(visited[0]?.options).toBe(visited[1]?.options);
		expect(
			reportsByFilePath.get("/first.ts").map((report) => report.about.id),
		).toEqual(["test/first", "test/first", "test/first", "test/second"]);
		expect(reportsByFilePath.get("/filtered.ts")).toEqual([]);
	});

	it("throws when setup reports without a file path", async () => {
		const language = createStubLanguage();
		const rule = ruleCreator.createRule(language, {
			about: { description: "", id: "missingFile" },
			messages,
			setup(context) {
				context.report({
					message: "message",
					range: { begin: 0, end: 0 },
				});
			},
		});

		await expect(
			runRules(new Map(), new Map([[rule, new Map()]]), host),
		).rejects.toThrow('Rule "missingFile" reported on file "undefined"');
	});

	it("throws when teardown reports on a file outside the lint run", async () => {
		const language = createStubLanguage();
		const rule = ruleCreator.createRule(language, {
			about: { description: "", id: "unknownFile" },
			messages,
			setup(context) {
				return {
					teardown() {
						context.report({
							filePath: "/unknown.ts",
							message: "message",
							range: { begin: 0, end: 0 },
						});
						return undefined;
					},
				};
			},
		});

		await expect(
			runRules(new Map(), new Map([[rule, new Map()]]), host),
		).rejects.toThrow('Rule "unknownFile" reported on file "/unknown.ts"');
	});
});
