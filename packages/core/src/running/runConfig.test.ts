import { afterEach, describe, expect, it, vi } from "vitest";

import { cacheStorageSchema } from "../cache/cacheSchema.ts";
import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import type { LintResults } from "../types/linting.ts";
import { runConfig } from "./runConfig.ts";
import { runConfigFixing } from "./runConfigFixing.ts";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://example.com/${ruleId}`,
	pluginId: "test",
	presets: [],
});

describe(runConfig, () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it.each([
		{
			cacheLocation: undefined,
			configured: undefined,
			expected: "/Project/node_modules/.cache/flint.json",
		},
		{
			cacheLocation: undefined,
			configured: "cache",
			expected: "/Project/cache/flint.json",
		},
		{
			cacheLocation: "cache/results.json",
			configured: "unused",
			expected: "/Project/cache/results.json",
		},
		{
			cacheLocation: "/Shared/cache",
			configured: "unused",
			expected: "/Shared/cache/flint.json",
		},
		{
			cacheLocation: "/Shared/results.json",
			configured: undefined,
			expected: "/Shared/results.json",
		},
	])(
		"uses host-rooted paths for cache location $expected",
		async ({ cacheLocation, configured, expected }) => {
			for (const fixing of [false, true]) {
				const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
				const host = createVFSLinterHost({
					caseSensitive: false,
					cwd: "/Project",
				});
				expect(host.getCurrentDirectory()).not.toBe(process.cwd());
				const language = createLanguage<{ text: string }>({
					about: { name: "test" },
					createFileFactory: () => ({
						createFile: (about) => ({ about, services: {} }),
					}),
					getFileCacheImpacts: (file) => ({
						dependencies: file.about.filePath.endsWith("a.txt")
							? ["Data/Dependency.json", "data/dependency.json"]
							: [],
						isGlobalDependency: false,
					}),
					runFileVisitors(file, fileVisitors): void {
						for (const { services, visitors } of fileVisitors) {
							visitors.text?.(file.about.sourceText, services);
						}
					},
				});
				const rule = ruleCreator.createRule(language, {
					about: { description: "Report source contents", id: "contents" },
					messages: {
						contents: { primary: "{{ text }}", secondary: [], suggestions: [] },
					},
					setup: (context) => ({
						visitors: {
							text(text): void {
								context.report({
									data: { text },
									fix:
										text === "fix"
											? {
													range: { begin: 0, end: text.length },
													text: "fixed",
												}
											: undefined,
									message: "contents",
									range: { begin: 0, end: text.length },
								});
							},
						},
					}),
				});
				const config = {
					...(configured && { cacheLocation: configured }),
					filePath: "config/../flint.config.ts",
					use: [{ files: ["*.txt"], rules: [rule] }],
				};
				for (const [path, text] of Object.entries({
					"/Project/a.txt": fixing ? "fix" : "initial",
					"/Project/b.txt": "control",
					"/Project/Data/Dependency.json": "{}",
					"/Project/flint.config.ts": "",
					"/Project/package.json": "{}",
				})) {
					host.vfsUpsertFile(path, text);
				}
				const run = (): Promise<LintResults> =>
					fixing
						? runConfigFixing(config, host, {
								cacheLocation,
								ignoreCache: false,
								requestedSuggestions: new Set(),
								skipLanguageReports: false,
							})
						: runConfig(config, host, { cacheLocation });
				const initial = await run();
				expect(
					initial.allFileResults.get("/Project/a.txt")?.reports[0]?.data,
				).toEqual({ text: fixing ? "fixed" : "initial" });
				expect(host.readFileSync("/Project/a.txt")).toBe(
					fixing ? "fixed" : "initial",
				);
				expect(
					initial.allFileResults.get("/Project/a.txt")?.dependencies,
				).toEqual(new Set(["/Project/Data/Dependency.json"]));
				const storage = cacheStorageSchema.decode(
					host.readFileSync(expected) ?? "",
				);
				expect(Object.keys(storage.configs).toSorted()).toEqual([
					"/Project/flint.config.ts",
					"/Project/package.json",
				]);
				expect(config.filePath).toBe("config/../flint.config.ts");
				expect((await run()).cached?.size).toBe(2);
				for (const [path, expectedCached] of [
					["/Project/a.txt", ["/Project/b.txt"]],
					["/Project/Data/Dependency.json", ["/Project/b.txt"]],
					["/Project/flint.config.ts", []],
					["/Project/package.json", []],
				] as const) {
					clock.mockReturnValue(Date.now() + 1000);
					host.vfsUpsertFile(path, "changed");
					const changed = await run();
					expect(Array.from(changed.cached?.keys() ?? [])).toEqual(
						expectedCached,
					);
					expect(
						changed.allFileResults.get("/Project/a.txt")?.reports[0]?.data,
					).toEqual({ text: "changed" });
					expect(
						changed.allFileResults.get("/Project/b.txt")?.reports[0]?.data,
					).toEqual({ text: "control" });
					expect((await run()).cached?.size).toBe(2);
				}
				expect(
					host
						.vfsListFiles()
						.keys()
						.every((path) => path.startsWith("/")),
				).toBe(true);
				clock.mockRestore();
			}
		},
	);

	it.each(["changed", "deleted"])(
		"re-lints unrelated files when a global declaration is %s after a cache hit",
		async (change) => {
			const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
			const globalPath = "/root/global.d.ts";
			const unrelatedPath = "/root/unrelated.ts";
			const visited: string[] = [];
			const language = createLanguage<{ text: string }>({
				about: { name: "test" },
				createFileFactory: () => ({
					createFile: (about) => ({ about, services: {} }),
				}),
				getFileCacheImpacts: (file) => ({
					dependencies: [],
					isGlobalDependency: file.about.filePath === globalPath,
				}),
				runFileVisitors(file, fileVisitors): void {
					visited.push(file.about.filePath);
					for (const { services, visitors } of fileVisitors) {
						visitors.text?.(file.about.sourceText, services);
					}
				},
			});
			const rule = ruleCreator.createRule(language, {
				about: { description: "Report the global declaration", id: "test" },
				messages: {
					global: {
						primary: "Global: {{ declaration }}",
						secondary: ["This declaration applies to every file."],
						suggestions: ["Check the global declaration."],
					},
				},
				setup: (context) => ({
					visitors: {
						text(): void {
							context.report({
								data: {
									declaration: host.readFileSync(globalPath) ?? "missing",
								},
								message: "global",
								range: { begin: 0, end: 1 },
							});
						},
					},
				}),
			});
			const config = {
				filePath: "/root/flint.config.ts",
				use: [{ files: ["global.d.ts", "unrelated.ts"], rules: [rule] }],
			};
			const options = { cacheLocation: "/root/cache.json" };
			host.vfsUpsertFile(config.filePath, "");
			host.vfsUpsertFile("/root/package.json", "{}");
			host.vfsUpsertFile(globalPath, "declare const value: string;");
			host.vfsUpsertFile(unrelatedPath, "value;");

			const initial = await runConfig(config, host, options);
			expect(visited).toContain(unrelatedPath);
			expect(initial.allFileResults.get(unrelatedPath)?.dependencies).toEqual(
				new Set(),
			);
			expect(
				initial.allFileResults.get(unrelatedPath)?.reports[0]?.data,
			).toEqual({
				declaration: "declare const value: string;",
			});
			visited.length = 0;
			clock.mockReturnValue(2000);

			const unchanged = await runConfig(config, host, options);
			expect(visited).toEqual([]);
			expect(unchanged.cached?.has(globalPath)).toBe(true);
			expect(unchanged.cached?.has(unrelatedPath)).toBe(true);
			expect(
				unchanged.allFileResults.get(unrelatedPath)?.reports[0]?.data,
			).toEqual({ declaration: "declare const value: string;" });
			clock.mockReturnValue(3000);
			if (change === "changed") {
				host.vfsUpsertFile(globalPath, "declare const value: number;");
			} else {
				host.vfsDeleteFile(globalPath);
			}

			const changed = await runConfig(config, host, options);
			expect(visited).toContain(unrelatedPath);
			expect(
				changed.allFileResults.get(unrelatedPath)?.reports[0]?.data,
			).toEqual({
				declaration:
					change === "changed" ? "declare const value: number;" : "missing",
			});
		},
	);
});
