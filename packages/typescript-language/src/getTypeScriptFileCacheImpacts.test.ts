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

describe(getTypeScriptFileCacheImpacts, () => {
	it("depends on the file's tsconfig, the configs it extends, and its package.json", () => {
		const host = createTestHost();
		const factory = typescriptLanguage.createFileFactory(host);
		using file = factory.createFile({
			filePath: "src/a.ts",
			filePathAbsolute: `${root}/src/a.ts`,
			sourceText: "export const url = import.meta.url;",
		});

		expect(getTypeScriptFileCacheImpacts(file, host).dependencies).toEqual([
			"tsconfig.json",
			"tsconfig.base.json",
			"package.json",
		]);

		factory[Symbol.dispose]?.();
	});

	it.each([
		[
			"tsconfig.base.json",
			{ compilerOptions: { module: "nodenext", strict: true } },
			"TS7006",
		],
		["package.json", {}, "TS1470"],
	])(
		"relints dependents after %s changes",
		async (fileName, contents, code) => {
			const host = createTestHost();
			using session = await LintSession.create(
				{
					filePath: `${root}/flint.config.ts`,
					use: [{ files: ["src/*.ts"], rules: [rule] }],
				},
				host,
			);
			await session.lintFiles(session.allFilePaths);

			host.vfsUpsertFile(`${root}/${fileName}`, JSON.stringify(contents));
			const results = await session.lintChangedFiles([`${root}/${fileName}`]);

			expect(
				Array.from(results.values()).flatMap((fileResults) =>
					fileResults.languageReports.map((report) => report.code),
				),
			).toContain(code);
		},
	);
});

function createTestHost(): VFSLinterHost {
	const host = createVFSLinterHost({ caseSensitive: true, cwd: root });
	host.vfsUpsertFile(
		`${root}/package.json`,
		JSON.stringify({ type: "module" }),
	);
	host.vfsUpsertFile(
		`${root}/tsconfig.base.json`,
		JSON.stringify({ compilerOptions: { module: "nodenext" } }),
	);
	host.vfsUpsertFile(
		`${root}/tsconfig.json`,
		JSON.stringify({ extends: "./tsconfig.base.json", files: ["src/a.ts"] }),
	);
	host.vfsUpsertFile(
		`${root}/src/a.ts`,
		"export const url = import.meta.url;\nexport function identity(value) {\n\treturn value;\n}\n",
	);

	return host;
}
