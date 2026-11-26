import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cacheStorageSchema } from "../cache/cacheFormat.ts";
import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import type { Fix } from "../types/changes.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LinterHost } from "../types/host.ts";
import type { LanguageReport } from "../types/languages.ts";
import type { LintResultsWithChanges } from "../types/linting.ts";
import type { CharacterReportRange } from "../types/ranges.ts";
import {
	LintSession,
	type LintSessionFixOptions,
	type LintSessionOptions,
} from "./LintSession.ts";

const filePath = "/root/file.txt";
const cacheLocation = "/root/cache.json";
const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
const writeFile = vi.spyOn(host, "writeFile");
const visit = vi.fn();
const getFix = vi.fn((): Fix[] => []);
const getLanguageReports = vi.fn((): LanguageReport[] => []);
const adjustReportRange = vi.fn(
	(range: CharacterReportRange): CharacterReportRange | null => range,
);
const fixes: Fix[] = [
	{ range: { begin: 1, end: 2 }, text: "B" },
	{ range: { begin: 2, end: 3 }, text: "C" },
];
const language = createLanguage<{ text: string }>({
	about: { name: "test" },
	createFileFactory: () => ({
		createFile: (about) => ({ about, adjustReportRange, services: {} }),
	}),
	getLanguageReports,
	runFileVisitors(file, fileVisitors): void {
		visit();
		for (const { services, visitors } of fileVisitors) {
			visitors.text?.(file.about.sourceText, services);
		}
	},
});
const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://example.com/${ruleId}`,
	pluginId: "test",
	presets: [],
});
const rule = ruleCreator.createRule(language, {
	about: { description: "Test fixes", id: "test" },
	messages: {
		test: { primary: "Test report", secondary: [], suggestions: [] },
	},
	setup: (context) => ({
		visitors: {
			text(sourceText): void {
				if (sourceText === "abc") {
					context.report({
						fix: getFix(),
						message: "test",
						range: { begin: 0, end: 1 },
					});
				}
			},
		},
	}),
});
const config = {
	filePath: "/root/flint.config.ts",
	use: [{ files: ["*.txt"], rules: [rule] }],
};
const options = {
	cacheLocation,
	ignoreCache: true,
	requestedSuggestions: new Set<string>(),
	skipLanguageReports: false,
};

describe("LintSession.fixFiles", () => {
	beforeEach(() => {
		getFix.mockReset();
		getLanguageReports.mockReset();
		adjustReportRange.mockReset();
		host.vfsUpsertFile(filePath, "abc");
	});

	it("does not write or repeat fixing for explicit empty fixes", async () => {
		const results = await fixAndWriteCache(config, host, options);

		expect(visit).toHaveBeenCalledTimes(1);
		expect(results.changed).toEqual(new Set());
		expect(host.readFileSync(filePath)).toBe("abc");
		expect(writeFile).toHaveBeenCalledExactlyOnceWith(
			cacheLocation,
			expect.any(String),
		);
		expect(
			results.allFileResults.get(filePath)?.reports.map((report) => report.fix),
		).toEqual([[]]);
	});

	it("does not write or repeat fixing when source mapping filters out all fixes", async () => {
		getFix.mockReturnValue(fixes);
		adjustReportRange
			.mockReturnValue(null)
			.mockReturnValueOnce({ begin: 0, end: 1 });

		const results = await fixAndWriteCache(config, host, options);

		expect(visit).toHaveBeenCalledTimes(1);
		expect(results.changed).toEqual(new Set());
		expect(host.readFileSync(filePath)).toBe("abc");
		expect(writeFile).toHaveBeenCalledExactlyOnceWith(
			cacheLocation,
			expect.any(String),
		);
		expect(
			results.allFileResults.get(filePath)?.reports.map((report) => report.fix),
		).toEqual([[]]);
	});

	it.each([10, 11])(
		"verifies final contents after ten writes when convergence needs %d writes",
		async (limit) => {
			getLanguageReports.mockReturnValue([{ text: "Language report" }]);
			const fixingHost = createVFSLinterHost({
				caseSensitive: true,
				cwd: "/root",
			});
			const writeFixingFile = vi.spyOn(fixingHost, "writeFile");
			const cachedFilePath = "/root/cached.txt";
			fixingHost.vfsUpsertFile(filePath, "0");
			fixingHost.vfsUpsertFile(cachedFilePath, "5");
			fixingHost.vfsUpsertFile(config.filePath, "");
			fixingHost.vfsUpsertFile("package.json", "{}");
			fixingHost.vfsUpsertFile(
				cacheLocation,
				cacheStorageSchema.encode({
					configs: {
						[config.filePath]: Date.now(),
						"package.json": Date.now(),
					},
					files: { [cachedFilePath]: { timestamp: Date.now() } },
				}),
			);
			const incrementRule = ruleCreator.createRule(language, {
				about: { description: "Increment numbers", id: "increment" },
				messages: {
					increment: {
						primary: "Increment {{ value }}",
						secondary: ["The number is below the limit."],
						suggestions: ["Increment the number."],
					},
				},
				setup: (context) => ({
					visitors: {
						text(sourceText): void {
							if (Number(sourceText) >= limit) {
								return;
							}
							context.report({
								data: { value: sourceText },
								fix: {
									range: { begin: 0, end: sourceText.length },
									text: String(Number(sourceText) + 1),
								},
								message: "increment",
								range: { begin: 0, end: sourceText.length },
							});
						},
					},
				}),
			});

			const results = await fixAndWriteCache(
				{
					...config,
					cacheLocation: limit === 10 ? cacheLocation : "/root/unused.json",
					use: [{ files: ["*.txt"], rules: [incrementRule] }],
				},
				fixingHost,
				{
					...options,
					cacheLocation: limit === 10 ? undefined : cacheLocation,
					ignoreCache: false,
					skipLanguageReports: limit === 10,
				},
			);

			expect(fixingHost.readFileSync(filePath)).toBe("10");
			expect(results.changed).toEqual(new Set([filePath]));
			expect(results.allFileResults.get(filePath)?.languageReports).toEqual(
				limit === 10 ? [] : [{ text: "Language report" }],
			);
			expect(
				results.allFileResults
					.get(filePath)
					?.reports.map((report) => report.data),
			).toEqual(limit === 10 ? [] : [{ value: "10" }]);
			expect(fixingHost.readFileSync(cachedFilePath)).toBe("5");
			expect(results.allFileResults.get(cachedFilePath)?.reports).toEqual([]);
			expect(visit).toHaveBeenCalledTimes(11);
			expect(
				writeFixingFile.mock.calls.filter(
					([writtenPath]) => writtenPath === filePath,
				),
			).toHaveLength(10);
			const cache = cacheStorageSchema.decode(
				fixingHost.readFileSync(cacheLocation) ?? "",
			);
			expect(
				cache.files[filePath]?.reports?.map((report) => report.data) ?? [],
			).toEqual(limit === 10 ? [] : [{ value: "10" }]);
			expect(cache.files[cachedFilePath]?.reports).toBeUndefined();
			expect(fixingHost.readFileSync("/root/unused.json")).toBeUndefined();
		},
	);

	it("writes nonempty fixes and lints the changed file again", async () => {
		getFix.mockReturnValue(fixes);

		const results = await fixAndWriteCache(config, host, options);

		expect(visit).toHaveBeenCalledTimes(2);
		expect(results.changed).toEqual(new Set([filePath]));
		expect(host.readFileSync(filePath)).toBe("aBC");
		expect(writeFile).toHaveBeenCalledTimes(2);
		expect(writeFile).toHaveBeenNthCalledWith(1, filePath, "aBC");
		expect(writeFile).toHaveBeenNthCalledWith(
			2,
			cacheLocation,
			expect.any(String),
		);
		expect(results.allFileResults.get(filePath)?.reports).toEqual([]);
	});

	it("does not apply fixes to a file edited after it was linted", async () => {
		getFix.mockImplementation(() => {
			host.vfsUpsertFile(filePath, "xyz");
			return fixes;
		});

		const results = await fixAndWriteCache(config, host, options);

		expect(results.changed).toEqual(new Set());
		expect(host.readFileSync(filePath)).toBe("xyz");
		expect(writeFile).toHaveBeenCalledExactlyOnceWith(
			cacheLocation,
			expect.any(String),
		);
	});

	describe("with cached fixes", () => {
		const cachedAt = 1000;

		async function cacheFixes(): Promise<void> {
			vi.spyOn(Date, "now").mockReturnValue(cachedAt);
			getFix.mockReturnValue(fixes);
			host.vfsUpsertFile(config.filePath, "");
			host.vfsUpsertFile("package.json", "{}");
			host.vfsUpsertFile(filePath, "abc");
			{
				using session = await LintSession.create(config, host, {
					cacheLocation,
					ignoreCache: true,
				});
				await session.lint();
				await session.writeCache();
			}
			visit.mockClear();
			writeFile.mockClear();
		}

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("applies them without re-linting when the file is untouched since caching", async () => {
			await cacheFixes();
			vi.spyOn(Date, "now").mockReturnValue(cachedAt + 1000);

			const results = await fixAndWriteCache(config, host, {
				...options,
				ignoreCache: false,
			});

			expect(results.changed).toEqual(new Set([filePath]));
			expect(host.readFileSync(filePath)).toBe("aBC");
			expect(visit).toHaveBeenCalledTimes(1);
		});

		it("skips them when the file was touched after caching", async () => {
			await cacheFixes();
			vi.spyOn(Date, "now").mockReturnValue(cachedAt + 1);
			const readFile = host.readFile.bind(host);
			vi.spyOn(host, "readFile").mockImplementation(async (path) => {
				if (path === filePath) {
					host.vfsUpsertFile(filePath, "xyz");
				}
				return await readFile(path);
			});

			const results = await fixAndWriteCache(config, host, {
				...options,
				ignoreCache: false,
			});

			expect(visit).not.toHaveBeenCalled();
			expect(results.changed).toEqual(new Set());
			expect(host.readFileSync(filePath)).toBe("xyz");
		});
	});
});

async function fixAndWriteCache(
	configDefinition: ProcessedConfigDefinition,
	host: LinterHost,
	{
		cacheLocation,
		ignoreCache,
		...fixOptions
	}: LintSessionFixOptions & LintSessionOptions,
): Promise<LintResultsWithChanges> {
	using session = await LintSession.create(configDefinition, host, {
		cacheLocation,
		ignoreCache,
	});
	const { changed } = await session.fixFiles(
		(await session.lint(fixOptions)).allFileResults,
		fixOptions,
	);
	await session.writeCache();
	return { ...session.getResults(), changed };
}
