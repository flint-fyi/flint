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
};

describe(getTypeScriptFileCacheImpacts, () => {
	it("depends on the file's configs, its package.json, and the files its imports resolve through", () => {
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
		]);
		expect(impacts.missingDependencies).toEqual(
			expect.arrayContaining([
				`${root}/generated/mapped.ts`,
				`${root}/generated/scheme.ts`,
				`${root}/node_modules/missing/package.json`,
				`${root}/src/node_modules/library/package.json`,
				`${root}/src/relative.ts`,
			]),
		);
		expect(impacts.missingDependencies).not.toContain(
			`${root}/node_modules/@types/library/package.json`,
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
});

function createTestHost(): VFSLinterHost {
	const host = createVFSLinterHost({ caseSensitive: true, cwd: root });
	for (const [filePath, content] of Object.entries({
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
			"export const url = import.meta.url;",
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
