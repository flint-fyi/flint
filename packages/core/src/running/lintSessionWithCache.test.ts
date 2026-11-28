import { afterEach, describe, expect, it, vi, type MockInstance } from "vitest";

import { writeToCache } from "../cache/writeToCache.ts";
import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import type { VFSLinterHost } from "../types/host.ts";
import type { LintResults } from "../types/linting.ts";
import { LintSession } from "./LintSession.ts";
import { lintSessionWithCache } from "./lintSessionWithCache.ts";

const aPath = "/root/a.ts";
const bPath = "/root/b.ts";
const cPath = "/root/c.ts";
const cacheLocation = "/root/cache.json";
const configFilePath = "/root/flint.config.ts";

describe(lintSessionWithCache, () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("re-lints cached dependents of a changed file", async () => {
		const { clock, host, lint, visited } = createTestProject();
		await lint();
		clock.mockReturnValue(2000);
		host.vfsUpsertFile(bPath, "b2");
		visited.length = 0;

		const results = await lint();

		expect(visited.toSorted()).toEqual([aPath, bPath]);
		expect(results.cached && Array.from(results.cached.keys())).toEqual([
			cPath,
		]);
		expect(results.allFileResults.get(aPath)?.reports[0]?.data).toEqual({
			text: "a1",
		});
	});

	it("re-lints every file when a changed file becomes a global dependency", async () => {
		const { clock, globalFilePaths, host, lint, visited } = createTestProject();
		await lint();
		clock.mockReturnValue(2000);
		globalFilePaths.add(bPath);
		host.vfsUpsertFile(bPath, "b2");
		visited.length = 0;

		const results = await lint();

		expect(visited.toSorted()).toEqual([aPath, bPath, cPath]);
		expect(results.cached && Array.from(results.cached.keys())).toEqual([]);
	});
});

function createTestProject(): {
	clock: MockInstance<() => number>;
	globalFilePaths: Set<string>;
	host: VFSLinterHost;
	lint: () => Promise<LintResults>;
	visited: string[];
} {
	const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
	const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
	const globalFilePaths = new Set<string>();
	const visited: string[] = [];
	const language = createLanguage<{ text: string }>({
		about: { name: "test" },
		createFileFactory: () => ({
			createFile: (about) => ({ about, services: {} }),
		}),
		getFileCacheImpacts: (file) => ({
			dependencies: file.about.filePath === aPath ? [bPath] : [],
			isGlobalDependency: globalFilePaths.has(file.about.filePath),
		}),
		runFileVisitors(file, fileVisitors): void {
			visited.push(file.about.filePath);
			for (const useFileVisitors of fileVisitors) {
				useFileVisitors((services, visitors) => {
					visitors.text?.(file.about.sourceText, services);
				});
			}
		},
	});
	const rule = new RuleCreator({
		docs: (ruleId) => `https://example.com/${ruleId}`,
		pluginId: "test",
		presets: [],
	}).createRule(language, {
		about: { description: "Report the file text.", id: "test" },
		messages: {
			text: {
				primary: "Text: {{ text }}",
				secondary: ["The file text."],
				suggestions: ["Check the file text."],
			},
		},
		setup: (context) => ({
			visitors: {
				text(text): void {
					context.report({
						data: { text },
						message: "text",
						range: { begin: 0, end: 1 },
					});
				},
			},
		}),
	});
	const configDefinition = {
		filePath: configFilePath,
		use: [{ files: ["a.ts", "b.ts", "c.ts"], rules: [rule] }],
	};

	host.vfsUpsertFile(configFilePath, "");
	// Cache config validation currently looks up this relative path.
	host.vfsUpsertFile("package.json", "{}");
	host.vfsUpsertFile(aPath, "a1");
	host.vfsUpsertFile(bPath, "b1");
	host.vfsUpsertFile(cPath, "c1");

	async function lint(): Promise<LintResults> {
		using session = await LintSession.create(configDefinition, host);
		const results = await lintSessionWithCache(session, configFilePath, host, {
			cacheLocation,
		});
		await writeToCache(host, configFilePath, results, cacheLocation);
		return results;
	}

	return { clock, globalFilePaths, host, lint, visited };
}
