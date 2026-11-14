import { afterEach, describe, expect, it, vi } from "vitest";

import { writeToCache } from "../cache/writeToCache.ts";
import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import { LintSession } from "./LintSession.ts";
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

	it("retains each result's lint time when writing a later session checkpoint", async () => {
		const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		const language = createLanguage<object>({
			about: { name: "test" },
			createFileFactory: () => ({
				createFile: (about) => ({ about, services: {} }),
			}),
			getLanguageReports: (file) => [{ text: file.about.sourceText }],
			runFileVisitors() {
				/* Diagnostics provide the observable results. */
			},
		});
		const config = {
			filePath: "/root/flint.config.js",
			use: [
				{
					files: ["*.txt"],
					rules: [
						ruleCreator.createRule(language, {
							about: { description: "Test.", id: "test" },
							messages: {},
							setup: () => ({}),
						}),
					],
				},
			],
		};
		host.vfsUpsertFile(config.filePath, "");
		host.vfsUpsertFile("/root/a.txt", "a1");
		host.vfsUpsertFile("/root/b.txt", "b1");
		using session = await LintSession.create(config, host);
		await session.lintFiles(session.allFilePaths);
		clock.mockReturnValue(2000);
		host.vfsUpsertFile("/root/b.txt", "b2");
		await session.lintChangedFiles(["/root/a.txt"]);
		const snapshot = session.getResults();
		clock.mockReturnValue(3000);
		await writeToCache(host, config.filePath, snapshot, undefined);
		const restored = await runConfig(config, host, {});
		expect(new Set(restored.cached?.keys())).toEqual(new Set(["/root/a.txt"]));
		expect(restored.allFileResults.get("/root/b.txt")?.languageReports).toEqual(
			[{ text: "b2" }],
		);
		expect(snapshot.allFileResults.get("/root/b.txt")?.languageReports).toEqual(
			[{ text: "b1" }],
		);
	});

	it("finishes checkpoint restoration for matched files with no enabled rules", async () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		const config = {
			filePath: "/root/flint.config.js",
			use: [{ files: ["*.txt"], rules: [] }],
		};
		host.vfsUpsertFile(config.filePath, "");
		host.vfsUpsertFile("/root/a.txt", "a1");
		await runConfig(config, host, {});
		expect((await runConfig(config, host, {})).allFileResults.size).toBe(0);
	});

	it("counts only rules with matched files", async () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		const language = createLanguage<{ text: string }>({
			about: { name: "test" },
			createFileFactory: () => ({
				createFile: (about) => ({ about, services: {} }),
			}),
			runFileVisitors(file, fileVisitors): void {
				for (const { services, visitors } of fileVisitors) {
					visitors.text?.(file.about.sourceText, services);
				}
			},
		});
		const createRule = (id: string) =>
			ruleCreator.createRule(language, {
				about: { description: "Test rule.", id },
				messages: {},
				setup() {
					return;
				},
			});
		const config = {
			filePath: "/root/flint.config.ts",
			use: [
				{ files: ["*.ts"], rules: [createRule("matched")] },
				{ files: ["*.missing"], rules: [createRule("unmatched")] },
			],
		};
		host.vfsUpsertFile(config.filePath, "");
		host.vfsUpsertFile("/root/a.ts", "");

		const results = await runConfig(config, host, { ignoreCache: true });

		expect(results.ruleCount).toBe(1);
	});

	it.each(["changed", "deleted", "introduced", "stopped"])(
		"re-lints unrelated files when a global declaration is %s after a cache hit",
		async (change) => {
			const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
			const globalPath = "/root/global.d.ts";
			const unrelatedPath = "/root/unrelated.ts";
			const initialDeclaration =
				change === "introduced" ? "export {};" : "declare const value: string;";
			const finalDeclaration =
				change === "stopped" ? "export {};" : "declare const value: number;";
			const visited: string[] = [];
			const language = createLanguage<{ text: string }>({
				about: { name: "test" },
				createFileFactory: () => ({
					createFile: (about) => ({ about, services: {} }),
				}),
				getFileCacheImpacts: (file) => ({
					dependencies: [],
					isGlobalDependency:
						file.about.filePath === globalPath &&
						file.about.sourceText.startsWith("declare"),
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
			host.vfsUpsertFile(globalPath, initialDeclaration);
			host.vfsUpsertFile(unrelatedPath, "value;");

			const initial = await runConfig(config, host, options);
			expect(visited).toContain(unrelatedPath);
			expect(initial.allFileResults.get(unrelatedPath)?.dependencies).toEqual(
				new Set(),
			);
			expect(
				initial.allFileResults.get(unrelatedPath)?.reports[0]?.data,
			).toEqual({
				declaration: initialDeclaration,
			});
			visited.length = 0;
			clock.mockReturnValue(2000);

			const unchanged = await runConfig(config, host, options);
			expect(visited).toEqual([]);
			expect(unchanged.cached?.has(globalPath)).toBe(true);
			expect(unchanged.cached?.has(unrelatedPath)).toBe(true);
			expect(
				unchanged.allFileResults.get(unrelatedPath)?.reports[0]?.data,
			).toEqual({ declaration: initialDeclaration });
			clock.mockReturnValue(3000);
			if (change === "deleted") {
				host.vfsDeleteFile(globalPath);
			} else {
				host.vfsUpsertFile(globalPath, finalDeclaration);
			}

			const changed = await runConfig(config, host, options);
			expect(visited).toContain(unrelatedPath);
			expect(
				changed.allFileResults.get(unrelatedPath)?.reports[0]?.data,
			).toEqual({
				declaration: change === "deleted" ? "missing" : finalDeclaration,
			});
		},
	);
});
