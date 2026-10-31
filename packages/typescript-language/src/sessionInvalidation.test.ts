import { afterEach, describe, expect, it, vi } from "vitest";

import {
	createVFSLinterHost,
	LintSession,
	lintSessionWithCache,
	RuleCreator,
	runConfig,
	type ProcessedConfigDefinition,
} from "@flint.fyi/core";

import { typescriptLanguage } from "./language.ts";

const configFilePath = "/root/flint.config.js";
const aPath = "/root/a.ts";
const bPath = "/root/b.ts";
const globalPath = "/root/global.d.ts";
const allPaths = new Set([aPath, bPath, globalPath]);
const ruleCreator = new RuleCreator({
	docs: (ruleId) => `https://example.com/${ruleId}`,
	pluginId: "test",
	presets: [],
});

describe.each([false, true])(
	"TypeScript session and disk invalidation with retained factories: %s",
	(retainFactories) => {
		afterEach(() => vi.restoreAllMocks());

		it.each([
			{
				affected: [aPath],
				diagnostic: aPath,
				path: "/shared/dependency.ts",
				text: "export const value = 1;",
			},
			{
				affected: [aPath],
				diagnostic: aPath,
				path: "/root/node_modules/library/index.d.ts",
				text: "export declare const libraryValue: number;",
			},
			{
				affected: [...allPaths],
				diagnostic: aPath,
				path: globalPath,
				text: "declare const ambient: number;",
			},
			{
				affected: [...allPaths],
				diagnostic: bPath,
				path: "/shared/compiler-options.json",
				text: '{"compilerOptions":{"strictNullChecks":true}}',
			},
			{
				affected: [...allPaths],
				diagnostic: bPath,
				path: "/root/settings/project.json",
				text: '{"extends":"/shared/compiler-options.json","compilerOptions":{"strictNullChecks":true},"include":["../*.ts"]}',
			},
			{
				affected: [...allPaths],
				inferred: true,
				path: "/root/tsconfig.json",
				text: '{"compilerOptions":{"strictNullChecks":false,"noLib":true,"module":"nodenext"},"include":["*.ts"]}',
			},
			{
				affected: [...allPaths],
				path: "/root/package.json",
				text: '{"type":"commonjs"}',
			},
			{
				affected: [...allPaths],
				path: "/shared/package.json",
				text: '{"type":"module"}',
			},
			{
				affected: [],
				path: "/root/tsconfig.unrelated.json",
				text: '{"compilerOptions":{"strict":true}}',
			},
		])(
			"agrees for $path",
			async ({ affected, diagnostic, inferred, path, text }) => {
				const now = vi.spyOn(Date, "now").mockReturnValue(1000);
				const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
				for (const [filePath, content] of Object.entries({
					"/root/node_modules/library/index.d.ts":
						"export declare const libraryValue: string;",
					"/root/node_modules/library/package.json": '{"types":"index.d.ts"}',
					"/root/package.json": '{"type":"module"}',
					"/root/settings/project.json":
						'{"extends":"/shared/compiler-options.json","compilerOptions":{"module":"nodenext","noLib":true},"include":["../*.ts"]}',
					"/root/tsconfig.json":
						'{"files":[],"references":[{"path":"./settings/project.json"}]}',
					"/shared/compiler-options.json":
						'{"compilerOptions":{"strictNullChecks":false}}',
					"/shared/dependency.ts": 'export const value = "text";',
					[aPath]:
						'import { value } from "../shared/dependency.js"; import { libraryValue } from "library"; export const libraryAssignment: string = libraryValue; export const assigned: string = value; export const globalValue: string = ambient;',
					[bPath]: "export const optional: string = undefined;",
					[configFilePath]: "",
					[globalPath]: "declare const ambient: string;",
				})) {
					host.vfsUpsertFile(filePath, content);
				}
				if (inferred) {
					host.vfsDeleteFile("/root/tsconfig.json");
					host.vfsDeleteFile("/root/settings/project.json");
				}
				const config: ProcessedConfigDefinition = {
					filePath: configFilePath,
					use: [
						{
							files: ["*.ts"],
							rules: [
								ruleCreator.createRule(typescriptLanguage, {
									about: {
										description: "Collect TypeScript diagnostics.",
										id: "test",
									},
									messages: {},
									setup: () => ({}),
								}),
							],
						},
					],
				};
				const cold = await runConfig(config, host, {});
				expect(cold.allFileResults.get(aPath)?.dependencies).toEqual(
					new Set([
						"/root/node_modules/library/index.d.ts",
						"/shared/dependency.ts",
						...(inferred ? [] : [globalPath]),
					]),
				);
				expect(cold.cached).toBeUndefined();
				expect(new Set(cold.allFileResults.keys())).toEqual(allPaths);
				using session = await LintSession.create(config, host);
				const warm = await lintSessionWithCache(
					session,
					configFilePath,
					host,
					{},
				);
				expect(new Set(warm.cached?.keys())).toEqual(allPaths);
				expect(warm.allFileResults).toEqual(cold.allFileResults);
				if (retainFactories) {
					await session.lintFiles(session.allFilePaths);
				}
				expect(
					session.hasStructuralDependency("/root/settings/project.json"),
				).toBe(!inferred);
				expect(
					session.hasStructuralDependency("/shared/compiler-options.json"),
				).toBe(!inferred);
				expect(session.hasStructuralDependency("/root/tsconfig.json")).toBe(
					true,
				);
				now.mockReturnValue(2000);
				host.vfsUpsertFile(path, text);
				const changed = await session.lintChangedFiles([path]);
				expect(new Set(changed.keys())).toEqual(new Set(affected));
				const disk = await runConfig(config, host, {});
				expect(allPaths.difference(disk.cached ?? new Map())).toEqual(
					new Set(affected),
				);
				expect(disk.allFileResults).toEqual(session.storedResults);
				expect(
					Array.from(cold.allFileResults)
						.filter(([, result]) =>
							result.languageReports.some((report) => report.code === "TS2322"),
						)
						.map(([filePath]) => filePath),
				).toEqual(inferred ? [bPath] : []);
				expect(
					Array.from(disk.allFileResults)
						.filter(([, result]) =>
							result.languageReports.some((report) => report.code === "TS2322"),
						)
						.map(([filePath]) => filePath),
				).toEqual(diagnostic ? [diagnostic] : []);
			},
		);
	},
);
