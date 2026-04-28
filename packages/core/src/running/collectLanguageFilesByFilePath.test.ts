/* eslint-disable perfectionist/sort-maps */
import { describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import type { FileCacheStorage } from "../types/cache.ts";
import type { FileAboutData } from "../types/languages.ts";
import type { AnyRule } from "../types/rules.ts";
import { collectLanguageFilesByFilePath } from "./collectLanguageFilesByFilePath.ts";

const messages = { "": { primary: "", secondary: [], suggestions: [] } };
const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://example.com/${ruleId}`,
	pluginId: "test",
	presets: [],
});

describe(collectLanguageFilesByFilePath, () => {
	it("orders uncached file creation per language", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		for (const filePath of ["/root/a.ts", "/root/b.ts", "/root/c.ts"]) {
			host.vfsUpsertFile(filePath, "");
		}

		const orderedCreated: string[] = [];
		const orderedFilePaths = vi.fn((filePaths: readonly string[]) =>
			[...filePaths].reverse(),
		);
		const orderedLanguage = createStubLanguage(
			"ordered",
			orderedCreated,
			orderedFilePaths,
		);
		const orderedRule = ruleCreator.createRule(orderedLanguage, {
			about: { description: "", id: "ordered" },
			messages,
			setup: () => ({}),
		});
		const plainCreated: string[] = [];
		const plainLanguage = createStubLanguage("plain", plainCreated);
		const plainRule = ruleCreator.createRule(plainLanguage, {
			about: { description: "", id: "plain" },
			messages,
			setup: () => ({}),
		});
		const cached = new Map<string, FileCacheStorage>([
			["/root/c.ts", { timestamp: 0 }],
		]);
		const rulesOptionsByFile = new Map<AnyRule, Map<string, unknown>>([
			[
				orderedRule,
				new Map([
					["/root/a.ts", {}],
					["/root/b.ts", {}],
					["/root/c.ts", {}],
				]),
			],
			[
				plainRule,
				new Map([
					["/root/b.ts", {}],
					["/root/a.ts", {}],
				]),
			],
		]);

		const filesByPath = collectLanguageFilesByFilePath(
			cached,
			rulesOptionsByFile,
			host,
		);

		expect(orderedFilePaths).toHaveBeenCalledWith(
			["/root/a.ts", "/root/b.ts"],
			host,
		);
		expect(orderedCreated).toEqual(["/root/b.ts", "/root/a.ts"]);
		expect(plainCreated).toEqual(["/root/b.ts", "/root/a.ts"]);
		expect(filesByPath.has("/root/c.ts")).toBe(false);
	});
});

function createStubLanguage(
	name: string,
	created: string[],
	orderFilePaths?: (filePaths: readonly string[]) => string[],
) {
	return createLanguage({
		about: { name },
		createFileFactory: () => ({
			createFile(data: FileAboutData) {
				created.push(data.filePath);
				return { about: data, services: {} };
			},
		}),
		...(orderFilePaths && { orderFilePaths }),
		runFileVisitors: vi.fn(),
	});
}
