import { beforeEach, describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import type { Fix } from "../types/changes.ts";
import type { CharacterReportRange } from "../types/ranges.ts";
import { runConfigFixing } from "./runConfigFixing.ts";

const filePath = "/root/file.txt";
const cacheLocation = "/root/cache.json";
const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
const writeFile = vi.spyOn(host, "writeFile");
const visit = vi.fn();
const getFix = vi.fn((): Fix[] => []);
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

describe(runConfigFixing, () => {
	beforeEach(() => {
		getFix.mockReset();
		adjustReportRange.mockReset();
		host.vfsUpsertFile(filePath, "abc");
	});

	it("does not write or repeat fixing for explicit empty fixes", async () => {
		const results = await runConfigFixing(config, host, options);

		expect(visit).toHaveBeenCalledTimes(1);
		expect(results.changed).toEqual(new Set());
		expect(host.readFileSync(filePath)).toBe("abc");
		expect(writeFile).not.toHaveBeenCalled();
		expect(
			results.allFileResults.get(filePath)?.reports.map((report) => report.fix),
		).toEqual([[]]);
	});

	it("does not write or repeat fixing when source mapping filters out all fixes", async () => {
		getFix.mockReturnValue(fixes);
		adjustReportRange
			.mockReturnValue(null)
			.mockReturnValueOnce({ begin: 0, end: 1 });

		const results = await runConfigFixing(config, host, options);

		expect(visit).toHaveBeenCalledTimes(1);
		expect(results.changed).toEqual(new Set());
		expect(host.readFileSync(filePath)).toBe("abc");
		expect(writeFile).not.toHaveBeenCalled();
		expect(
			results.allFileResults.get(filePath)?.reports.map((report) => report.fix),
		).toEqual([[]]);
	});

	it("writes nonempty fixes and lints the changed file again", async () => {
		getFix.mockReturnValue(fixes);

		const results = await runConfigFixing(config, host, options);

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
});
