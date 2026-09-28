import { afterEach, describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import { runConfig } from "./runConfig.ts";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://example.com/${ruleId}`,
	pluginId: "test",
	presets: [],
});

describe(runConfig, () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

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
			// Cache config validation currently looks up this relative path.
			host.vfsUpsertFile("package.json", "{}");
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
