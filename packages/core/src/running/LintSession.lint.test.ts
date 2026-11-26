import { afterEach, describe, expect, it, vi, type MockInstance } from "vitest";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { LinterHost, VFSLinterHost } from "../types/host.ts";
import type { LintResults } from "../types/linting.ts";
import { LintSession, type LintSessionOptions } from "./LintSession.ts";

const aPath = "/root/a.ts";
const bPath = "/root/b.ts";
const cPath = "/root/c.ts";
const cacheLocation = "/root/cache.json";
const configFilePath = "/root/flint.config.ts";

const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://example.com/${ruleId}`,
	pluginId: "test",
	presets: [],
});

describe("LintSession.lint", () => {
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
		// Cache config validation currently looks up this relative path.
		host.vfsUpsertFile("package.json", "{}");
		host.vfsUpsertFile("/root/a.txt", "a1");
		host.vfsUpsertFile("/root/b.txt", "b1");
		using session = await LintSession.create(config, host);
		await session.lintFiles(session.allFilePaths);
		clock.mockReturnValue(2000);
		host.vfsUpsertFile("/root/b.txt", "b2");
		await session.lintChangedFiles(["/root/a.txt"]);
		const snapshot = session.getResults();
		clock.mockReturnValue(3000);
		await session.writeCache();
		const restored = await lintAndWriteCache(config, host);
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
		await lintAndWriteCache(config, host, {});
		expect(
			(await lintAndWriteCache(config, host, {})).allFileResults.size,
		).toBe(0);
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

		const results = await lintAndWriteCache(config, host, {
			ignoreCache: true,
		});

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
			// Cache config validation currently looks up this relative path.
			host.vfsUpsertFile("package.json", "{}");
			host.vfsUpsertFile(globalPath, initialDeclaration);
			host.vfsUpsertFile(unrelatedPath, "value;");

			const initial = await lintAndWriteCache(config, host, options);
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

			const unchanged = await lintAndWriteCache(config, host, options);
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

			const changed = await lintAndWriteCache(config, host, options);
			expect(visited).toContain(unrelatedPath);
			expect(
				changed.allFileResults.get(unrelatedPath)?.reports[0]?.data,
			).toEqual({
				declaration: change === "deleted" ? "missing" : finalDeclaration,
			});
		},
	);

	it("restores the checkpoint only on the first lint", async () => {
		const { configDefinition, host, lint, visited } = createCachedProject();
		await lint();
		visited.length = 0;
		using session = await LintSession.create(configDefinition, host, {
			cacheLocation,
		});

		expect((await session.lint()).cached?.size).toBe(3);
		expect(visited).toEqual([]);
		expect((await session.lint()).cached?.size).toBe(0);
		expect(visited.toSorted()).toEqual([aPath, bPath, cPath]);
	});

	it("re-lints cached dependents of a changed file", async () => {
		const { clock, host, lint, visited } = createCachedProject();
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
		const { clock, globalFilePaths, host, lint, visited } =
			createCachedProject();
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

function createCachedProject(): {
	clock: MockInstance<() => number>;
	configDefinition: ProcessedConfigDefinition;
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
			for (const { services, visitors } of fileVisitors) {
				visitors.text?.(file.about.sourceText, services);
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
		return await lintAndWriteCache(configDefinition, host, { cacheLocation });
	}

	return { clock, configDefinition, globalFilePaths, host, lint, visited };
}

async function lintAndWriteCache(
	configDefinition: ProcessedConfigDefinition,
	host: LinterHost,
	options?: LintSessionOptions,
): Promise<LintResults> {
	using session = await LintSession.create(configDefinition, host, options);
	const results = await session.lint();
	await session.writeCache();
	return results;
}
