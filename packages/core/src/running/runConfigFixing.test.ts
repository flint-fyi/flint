import { describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import type { Fix } from "../types/changes.ts";
import type { CharacterReportRange } from "../types/ranges.ts";
import { runConfigFixing } from "./runConfigFixing.ts";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://example.com/${ruleId}`,
	pluginId: "test",
	presets: [],
});

describe(runConfigFixing, () => {
	it.each([
		{ expectedRounds: 1, kind: "explicit empty", shouldChange: false },
		{ expectedRounds: 1, kind: "source-mapped empty", shouldChange: false },
		{ expectedRounds: 2, kind: "nonempty", shouldChange: true },
	])("handles $kind fixes", async ({ expectedRounds, kind, shouldChange }) => {
		const filePath = "/root/file.txt";
		const cacheLocation = "/root/cache.json";
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		host.vfsUpsertFile(filePath, "abc");
		const writeFile = vi.spyOn(host, "writeFile");
		const visit = vi.fn();
		const language = createLanguage<{ text: string }>({
			about: { name: "test" },
			createFileFactory: () => ({
				createFile: (about) => ({
					about,
					...(kind === "source-mapped empty" && {
						adjustReportRange: (
							range: CharacterReportRange,
						): CharacterReportRange | null =>
							range.begin === 0 ? range : null,
					}),
					services: {},
				}),
			}),
			runFileVisitors(file, fileVisitors): void {
				visit();
				for (const { services, visitors } of fileVisitors) {
					visitors.text?.(file.about.sourceText, services);
				}
			},
		});
		const fix: Fix[] =
			kind === "explicit empty"
				? []
				: [
						{ range: { begin: 1, end: 2 }, text: "B" },
						{ range: { begin: 2, end: 3 }, text: "C" },
					];
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
								fix,
								message: "test",
								range: { begin: 0, end: 1 },
							});
						}
					},
				},
			}),
		});

		const results = await runConfigFixing(
			{
				filePath: "/root/flint.config.ts",
				use: [{ files: ["*.txt"], rules: [rule] }],
			},
			host,
			{
				cacheLocation,
				ignoreCache: true,
				requestedSuggestions: new Set(),
				skipLanguageReports: false,
			},
		);

		expect(visit).toHaveBeenCalledTimes(expectedRounds);
		expect(results.changed).toEqual(new Set(shouldChange ? [filePath] : []));
		expect(host.readFileSync(filePath)).toBe(shouldChange ? "aBC" : "abc");
		expect(
			writeFile.mock.calls.filter(([path]) => path !== cacheLocation),
		).toEqual(shouldChange ? [[filePath, "aBC"]] : []);
		expect(
			results.allFileResults.get(filePath)?.reports.map((report) => report.fix),
		).toEqual(shouldChange ? [] : [[]]);
	});
});
