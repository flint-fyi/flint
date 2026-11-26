import { describe, expect, it } from "vitest";

import {
	createVFSLinterHost,
	LintSession,
	RuleCreator,
	type VFSLinterHost,
} from "@flint.fyi/core";

import { getTypeScriptFileCacheImpacts } from "./getTypeScriptFileCacheImpacts.ts";
import { typescriptLanguage } from "./language.ts";

const root = "/workspace/repository/project";

const rule = new RuleCreator({
	docs: (ruleId) => `https://example.com/${ruleId}`,
	pluginId: "test",
	presets: [],
}).createRule(typescriptLanguage, {
	about: { description: "Visits every file.", id: "visit" },
	messages: {},
	setup() {
		return;
	},
});

const baseCompilerOptions = {
	module: "nodenext",
	paths: {
		"virtual:mapped/*": ["./generated/*"],
		"~generated/*": ["./generated/*"],
	},
	strict: false,
	types: ["ambient"],
};

describe(getTypeScriptFileCacheImpacts, () => {
	it("depends on the file's configs, package.json files, imports, and global declarations", () => {
		const host = createTestHost();
		const factory = typescriptLanguage.createFileFactory(host);
		using file = factory.createFile({
			filePath: "src/a.ts",
			filePathAbsolute: `${root}/src/a.ts`,
			sourceText: host.readFileSync(`${root}/src/a.ts`) ?? "",
		});

		const impacts = getTypeScriptFileCacheImpacts(file, host);

		expect(impacts.dependencies).toEqual([
			`${root}/tsconfig.json`,
			`${root}/tsconfig.base.json`,
			`${root}/package.json`,
			`${root}/node_modules/library/package.json`,
			`${root}/node_modules/missing/index.d.ts`,
			`${root}/node_modules/@types/ambient/index.d.ts`,
		]);
		expect(impacts.missingDependencies).toEqual(
			expect.arrayContaining([
				`${root}/.astro/types.d.ts`,
				`${root}/generated/mapped.ts`,
				`${root}/generated/scheme.ts`,
				`${root}/node_modules/missing/package.json`,
				`${root}/src/node_modules/library/package.json`,
				`${root}/src/jsconfig.json`,
				`${root}/src/package.json`,
				`${root}/src/relative.ts`,
				`${root}/src/tsconfig.json`,
			]),
		);
		expect(impacts.missingDependencies).not.toContain(`${root}/package.json`);
		expect(impacts.missingDependencies).not.toContain(`${root}/jsconfig.json`);
		expect(impacts.missingDependencies).not.toContain(
			`${root}/node_modules/@types/library/package.json`,
		);

		factory[Symbol.dispose]?.();
	});

	it("doesn't report closer package.json locations when they can't decide the module format", () => {
		const host = createTestHost();
		host.vfsUpsertFile(
			`${root}/tsconfig.base.json`,
			JSON.stringify({
				compilerOptions: { ...baseCompilerOptions, module: "preserve" },
			}),
		);
		const factory = typescriptLanguage.createFileFactory(host);
		using file = factory.createFile({
			filePath: "src/a.ts",
			filePathAbsolute: `${root}/src/a.ts`,
			sourceText: host.readFileSync(`${root}/src/a.ts`) ?? "",
		});

		const impacts = getTypeScriptFileCacheImpacts(file, host);

		expect(impacts.missingDependencies).toContain(`${root}/src/tsconfig.json`);
		expect(impacts.missingDependencies).not.toContain(
			`${root}/src/package.json`,
		);

		factory[Symbol.dispose]?.();
	});

	it.each([
		[
			"an extended tsconfig changes",
			"tsconfig.base.json",
			{ compilerOptions: { ...baseCompilerOptions, strict: true } },
			"TS7006",
		],
		["the package.json scope changes", "package.json", {}, "TS1470"],
		[
			"a closer package.json is created",
			"src/package.json",
			{ type: "commonjs" },
			"TS1470",
		],
		[
			"a closer tsconfig is created",
			"src/tsconfig.json",
			{
				compilerOptions: { ...baseCompilerOptions, strict: true },
				files: ["a.ts"],
			},
			"TS7006",
		],
		[
			"an imported package's exports change",
			"node_modules/library/package.json",
			{ exports: { ".": { types: "./other.d.ts" } }, name: "library" },
			"TS2305",
		],
		[
			"a missing package is installed",
			"node_modules/missing/package.json",
			{ name: "missing", types: "./index.d.ts" },
			"TS2322",
		],
		[
			"a file named by the tsconfig's include is generated",
			".astro/types.d.ts",
			'declare module "virtual:generated" {\n\texport const generated: string;\n}\n',
			"TS2322",
		],
		[
			"a module that a paths mapping points to is created",
			"generated/mapped.ts",
			'export const mapped = "text";\n',
			"TS2322",
		],
		[
			"a module that a paths mapping with a scheme points to is created",
			"generated/scheme.ts",
			'export const schemeMapped = "text";\n',
			"TS2322",
		],
		[
			"a relatively imported module is created",
			"src/relative.ts",
			'export const relative = "text";\n',
			"TS2322",
		],
		[
			"an external global declaration changes",
			"node_modules/@types/ambient/index.d.ts",
			"declare const ambientValue: string;\n",
			"TS2322",
		],
	])(
		"relints dependents after %s",
		async (_description, fileName, contents, code) => {
			const host = createTestHost();
			using session = await LintSession.create(
				{
					filePath: `${root}/flint.config.ts`,
					use: [{ files: ["src/*.ts"], rules: [rule] }],
				},
				host,
			);
			const initial = await session.lintFiles(session.allFilePaths);
			expect(getLanguageReportCodes(initial)).not.toContain(code);

			host.vfsUpsertFile(
				`${root}/${fileName}`,
				typeof contents === "string" ? contents : JSON.stringify(contents),
			);
			const results = await session.lintChangedFiles([`${root}/${fileName}`]);

			expect(getLanguageReportCodes(results)).toContain(code);
		},
	);

	// https://github.com/flint-fyi/flint/issues/1512
	it("relints after a generated declaration file that the tsconfig includes is created", async () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: root });
		const generatedPath = `${root}/.astro/types.d.ts`;
		host.vfsUpsertFile(`${root}/flint.config.ts`, "");
		host.vfsUpsertFile(
			`${root}/package.json`,
			JSON.stringify({ type: "module" }),
		);
		host.vfsUpsertFile(
			`${root}/tsconfig.json`,
			JSON.stringify({
				compilerOptions: { module: "nodenext", strict: true },
				include: [".astro/types.d.ts", "src"],
			}),
		);
		host.vfsUpsertFile(
			`${root}/src/a.ts`,
			'import { content } from "astro:content";\nexport const value: number = content;\n',
		);
		using session = await LintSession.create(
			{
				filePath: `${root}/flint.config.ts`,
				use: [{ files: ["src/*.ts"], rules: [rule] }],
			},
			host,
		);
		const unsynced = await session.lintFiles(session.allFilePaths);
		expect(getLanguageReportCodes(unsynced)).toContain("TS2307");

		host.vfsUpsertFile(
			generatedPath,
			'declare module "astro:content" {\n\texport const content: number;\n}\n',
		);
		const synced = await session.lintChangedFiles([generatedPath]);

		expect(synced.has(`${root}/src/a.ts`)).toBe(true);
		expect(getLanguageReportCodes(synced)).not.toContain("TS2307");
	});

	it("relints after a package that the tsconfig's types names is installed", async () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: root });
		const typesPath = `${root}/node_modules/@types/generated/index.d.ts`;
		host.vfsUpsertFile(`${root}/flint.config.ts`, "");
		host.vfsUpsertFile(
			`${root}/tsconfig.json`,
			JSON.stringify({
				compilerOptions: { module: "nodenext", types: ["generated"] },
				files: ["src/a.ts"],
			}),
		);
		host.vfsUpsertFile(
			`${root}/src/a.ts`,
			"export const value: number = generatedValue;\n",
		);
		using session = await LintSession.create(
			{
				filePath: `${root}/flint.config.ts`,
				use: [{ files: ["src/*.ts"], rules: [rule] }],
			},
			host,
		);
		const initial = await session.lintFiles(session.allFilePaths);
		expect(getLanguageReportCodes(initial)).not.toContain("TS2322");

		host.vfsUpsertFile(typesPath, "declare const generatedValue: string;\n");
		const results = await session.lintChangedFiles([typesPath]);

		expect(getLanguageReportCodes(results)).toContain("TS2322");
	});

	it("reports each module suffix of a missing types entry's lookups", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: root });
		host.vfsUpsertFile(
			`${root}/tsconfig.json`,
			JSON.stringify({
				compilerOptions: {
					module: "nodenext",
					moduleSuffixes: [".ios", ""],
					types: ["generated"],
				},
				files: ["src/a.ts"],
			}),
		);
		host.vfsUpsertFile(`${root}/src/a.ts`, "export {};\n");
		const factory = typescriptLanguage.createFileFactory(host);
		using file = factory.createFile({
			filePath: "src/a.ts",
			filePathAbsolute: `${root}/src/a.ts`,
			sourceText: "export {};\n",
		});

		const impacts = getTypeScriptFileCacheImpacts(file, host);

		expect(impacts.missingDependencies).toEqual(
			expect.arrayContaining([
				`${root}/node_modules/@types/generated/index.ios.d.ts`,
				`${root}/node_modules/@types/generated/index.d.ts`,
				`${root}/node_modules/@types/generated/package.json`,
			]),
		);
		expect(impacts.missingDependencies).not.toContain(
			`${root}/node_modules/@types/generated/package.ios.json`,
		);

		factory[Symbol.dispose]?.();
	});

	it("relints after a declaration file in a custom type root is created", async () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: root });
		const declarationPath = `${root}/types/untyped/index.d.ts`;
		host.vfsUpsertFile(`${root}/flint.config.ts`, "");
		host.vfsUpsertFile(
			`${root}/tsconfig.json`,
			JSON.stringify({
				compilerOptions: { module: "nodenext", typeRoots: ["./types"] },
				files: ["src/a.ts"],
			}),
		);
		host.vfsUpsertFile(
			`${root}/src/a.ts`,
			'import { untyped } from "untyped";\nexport const value: number = untyped;\n',
		);
		using session = await LintSession.create(
			{
				filePath: `${root}/flint.config.ts`,
				use: [{ files: ["src/*.ts"], rules: [rule] }],
			},
			host,
		);
		const initial = await session.lintFiles(session.allFilePaths);
		expect(getLanguageReportCodes(initial)).toContain("TS2307");

		host.vfsUpsertFile(
			declarationPath,
			"export declare const untyped: string;\n",
		);
		const results = await session.lintChangedFiles([declarationPath]);

		expect(getLanguageReportCodes(results)).toContain("TS2322");
	});

	it("relints after SvelteKit-style generated configs and types are created and regenerated", async () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: root });
		const generatedConfigPath = `${root}/node_modules/$app/tsconfig.json`;
		const generatedTypesPath = `${root}/node_modules/$app/types/index.d.ts`;
		const generateTypes = (routes: string): string =>
			`import "kit";\ndeclare module "$app/types" {\n\tinterface Routes {\n${routes}\t}\n}\n`;
		host.vfsUpsertFile(`${root}/flint.config.ts`, "");
		host.vfsUpsertFile(
			`${root}/node_modules/kit/package.json`,
			JSON.stringify({ name: "kit", types: "./index.d.ts" }),
		);
		host.vfsUpsertFile(
			`${root}/node_modules/kit/index.d.ts`,
			'declare module "$app/types" {\n\texport interface Routes {}\n\texport type RouteId = keyof Routes;\n}\n',
		);
		host.vfsUpsertFile(
			`${root}/package.json`,
			JSON.stringify({ type: "module" }),
		);
		host.vfsUpsertFile(
			`${root}/tsconfig.json`,
			JSON.stringify({ extends: "$app/tsconfig", files: ["src/a.ts"] }),
		);
		host.vfsUpsertFile(
			`${root}/src/a.ts`,
			'import type { RouteId } from "$app/types";\nexport const route: RouteId = "/other";\n',
		);
		using session = await LintSession.create(
			{
				filePath: `${root}/flint.config.ts`,
				use: [{ files: ["src/*.ts"], rules: [rule] }],
			},
			host,
		);
		const unsynced = await session.lintFiles(session.allFilePaths);
		expect(getLanguageReportCodes(unsynced)).toContain("TS2307");

		host.vfsUpsertFile(
			generatedConfigPath,
			JSON.stringify({
				compilerOptions: { module: "nodenext", types: ["$app/types"] },
			}),
		);
		host.vfsUpsertFile(
			generatedTypesPath,
			generateTypes('\t\t"/": unknown;\n'),
		);
		const synced = await session.lintChangedFiles([
			generatedConfigPath,
			generatedTypesPath,
		]);
		expect(getLanguageReportCodes(synced)).toContain("TS2322");

		host.vfsUpsertFile(
			generatedTypesPath,
			generateTypes('\t\t"/": unknown;\n\t\t"/other": unknown;\n'),
		);
		const regenerated = await session.lintChangedFiles([generatedTypesPath]);
		expect(regenerated.has(`${root}/src/a.ts`)).toBe(true);
		expect(getLanguageReportCodes(regenerated)).not.toContain("TS2322");
	});
});

function createTestHost(): VFSLinterHost {
	const host = createVFSLinterHost({ caseSensitive: true, cwd: root });
	for (const [filePath, content] of Object.entries({
		"node_modules/@types/ambient/index.d.ts":
			"declare const ambientValue: number;\n",
		"node_modules/library/index.d.ts": "export declare const value: number;\n",
		"node_modules/library/other.d.ts": "export {};\n",
		"node_modules/library/package.json": JSON.stringify({
			exports: { ".": { types: "./index.d.ts" } },
			name: "library",
		}),
		"node_modules/missing/index.d.ts":
			"export declare const missing: string;\n",
		"package.json": JSON.stringify({ type: "module" }),
		"src/a.ts": [
			'import { value } from "library";',
			'import { missing } from "missing";',
			'import { mapped } from "~generated/mapped.js";',
			'import { schemeMapped } from "virtual:mapped/scheme.js";',
			'import { relative } from "./relative.js";',
			'import { generated } from "virtual:generated";',
			"export const url = import.meta.url;",
			"export const ambient: number = ambientValue;",
			"export const fromInclude: number = generated;",
			"export const library: number = value;",
			"export const installed: number = missing;",
			"export const fromPaths: number = mapped;",
			"export const fromSchemePaths: number = schemeMapped;",
			"export const fromRelative: number = relative;",
			"export function identity(value) {",
			"\treturn value;",
			"}",
			"",
		].join("\n"),
		"tsconfig.base.json": JSON.stringify({
			compilerOptions: baseCompilerOptions,
		}),
		"tsconfig.json": JSON.stringify({
			extends: "./tsconfig.base.json",
			files: ["src/a.ts"],
			include: [".astro/types.d.ts"],
		}),
	})) {
		host.vfsUpsertFile(`${root}/${filePath}`, content);
	}

	return host;
}

function getLanguageReportCodes(
	results: Map<string, { languageReports: { code?: string }[] }>,
): (string | undefined)[] {
	return Array.from(results.values()).flatMap((fileResults) =>
		fileResults.languageReports.map((report) => report.code),
	);
}
