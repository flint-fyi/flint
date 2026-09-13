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
		using resources = new DisposableStack();
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
			resources,
		);

		expect(orderedFilePaths).toHaveBeenCalledWith(
			["/root/a.ts", "/root/b.ts"],
			host,
		);
		expect(orderedCreated).toEqual(["/root/b.ts", "/root/a.ts"]);
		expect(plainCreated).toEqual(["/root/b.ts", "/root/a.ts"]);
		expect(filesByPath.has("/root/c.ts")).toBe(false);
	});

	it("disposes files before their factory exactly once", () => {
		const events: string[] = [];
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		host.vfsUpsertFile("/root/index.ts", "");
		const language = createLanguage({
			about: { name: "disposable" },
			createFileFactory: () => ({
				createFile: (about) => ({
					about,
					services: {},
					[Symbol.dispose]: () => events.push("file"),
				}),
				[Symbol.dispose]: () => events.push("factory"),
			}),
			runFileVisitors: vi.fn(),
		});
		const rule = ruleCreator.createRule(language, {
			about: { description: "", id: "disposable" },
			messages,
			setup: () => ({}),
		});
		const resources = new DisposableStack();

		collectLanguageFilesByFilePath(
			undefined,
			new Map([[rule, new Map([["/root/index.ts", {}]])]]),
			host,
			resources,
		);
		resources.dispose();
		resources.dispose();

		expect(events).toEqual(["file", "factory"]);
	});

	it("disposes created resources when collection fails", () => {
		const events: string[] = [];
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		host.vfsUpsertFile("/root/first.ts", "");
		host.vfsUpsertFile("/root/second.ts", "");
		const language = createLanguage({
			about: { name: "failing" },
			createFileFactory: () => ({
				createFile: (about) => {
					if (about.filePath.endsWith("second.ts")) {
						throw new Error("creation failed");
					}
					return {
						about,
						services: {},
						[Symbol.dispose]: () => events.push("file"),
					};
				},
				[Symbol.dispose]: () => events.push("factory"),
			}),
			runFileVisitors: vi.fn(),
		});
		const rule = ruleCreator.createRule(language, {
			about: { description: "", id: "failing" },
			messages,
			setup: () => ({}),
		});

		expect(() => {
			using resources = new DisposableStack();
			collectLanguageFilesByFilePath(
				undefined,
				new Map([
					[
						rule,
						new Map([
							["/root/first.ts", {}],
							["/root/second.ts", {}],
						]),
					],
				]),
				host,
				resources,
			);
		}).toThrow("creation failed");
		expect(events).toEqual(["file", "factory"]);
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
