import { describe, expect, it } from "vitest";

import {
	createVFSLinterHost,
	LintSession,
	RuleCreator,
	type FileResults,
	type LinterHost,
	type VFSLinterHost,
} from "@flint.fyi/core";

import { getTypeScriptFileCacheImpacts } from "./getTypeScriptFileCacheImpacts.ts";
import { typescriptLanguage } from "./language.ts";

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
			filePathAbsolute: "/workspace/repository/project/src/a.ts",
			sourceText: "export const url = import.meta.url;",
		});

		expect(getTypeScriptFileCacheImpacts(file, host).dependencies).toEqual([
			"tsconfig.json",
			"tsconfig.base.json",
			"package.json",
		]);

		factory[Symbol.dispose]?.();
	});

	it("relints dependents with new compiler options after an extended tsconfig changes", async () => {
		const host = createTestHost();
		using session = await createTestSession(host);
		await session.lintFiles(session.allFilePaths);

		host.vfsUpsertFile(
			"/workspace/repository/project/tsconfig.base.json",
			JSON.stringify({ compilerOptions: { module: "nodenext", strict: true } }),
		);

		expect(
			languageReportCodes(
				await session.lintChangedFiles([
					"/workspace/repository/project/tsconfig.base.json",
				]),
			),
		).toContain("TS7006");
	});

	it("relints dependents with the new module format after the package.json changes", async () => {
		const host = createTestHost();
		using session = await createTestSession(host);
		await session.lintFiles(session.allFilePaths);

		host.vfsUpsertFile(
			"/workspace/repository/project/package.json",
			JSON.stringify({}),
		);

		expect(
			languageReportCodes(
				await session.lintChangedFiles([
					"/workspace/repository/project/package.json",
				]),
			),
		).toContain("TS1470");
	});
});

function createTestHost(): LinterHost & VFSLinterHost {
	const vfs = createVFSLinterHost({
		caseSensitive: true,
		cwd: "/workspace/repository/project",
	});
	vfs.vfsUpsertFile(
		"/workspace/repository/project/package.json",
		JSON.stringify({ type: "module" }),
	);
	vfs.vfsUpsertFile(
		"/workspace/repository/project/tsconfig.base.json",
		JSON.stringify({ compilerOptions: { module: "nodenext" } }),
	);
	vfs.vfsUpsertFile(
		"/workspace/repository/project/tsconfig.json",
		JSON.stringify({ extends: "./tsconfig.base.json", files: ["src/a.ts"] }),
	);
	vfs.vfsUpsertFile(
		"/workspace/repository/project/src/a.ts",
		"export const url = import.meta.url;\nexport function identity(value) {\n\treturn value;\n}\n",
	);

	return {
		...vfs,
		watchDirectorySync: vfs.watchDirectorySync,
		watchFileSync: vfs.watchFileSync,
	};
}

async function createTestSession(host: LinterHost) {
	return await LintSession.create(
		{
			filePath: "/workspace/repository/project/flint.config.ts",
			use: [{ files: ["src/*.ts"], rules: [rule] }],
		},
		host,
	);
}

function languageReportCodes(results: Map<string, FileResults>) {
	return Array.from(results.values()).flatMap((fileResults) =>
		fileResults.languageReports.map((report) => report.code),
	);
}
