import { describe, expect, it } from "vitest";

import {
	createVFSLinterHost,
	LintSession,
	RuleCreator,
	type VFSLinterHost,
} from "@flint.fyi/core";

import { vueLanguage } from "./language.ts";

const root = "/workspace/repository/project";
const appPath = `${root}/src/App.vue`;
const childPath = `${root}/src/Child.vue`;

const rule = new RuleCreator({
	docs: (ruleId) => `https://example.com/${ruleId}`,
	pluginId: "test",
	presets: [],
}).createRule(vueLanguage, {
	about: { description: "Visits every file.", id: "visit" },
	messages: {},
	setup() {
		return;
	},
});

describe("vueLanguage", () => {
	it("relints a component after a component it imports is created", async () => {
		const host = createTestHost();
		using session = await createSession(host);
		const initial = await session.lintFiles(session.allFilePaths);
		expect(getLanguageReportCodes(initial)).toContain("TS2307");

		host.vfsUpsertFile(childPath, createChild('"text"'));
		const results = await session.lintChangedFiles([childPath]);

		expect(results.has(appPath)).toBe(true);
		expect(getLanguageReportCodes(results)).not.toContain("TS2307");
	});

	it("relints a component after a component it imports changes", async () => {
		const host = createTestHost();
		host.vfsUpsertFile(childPath, createChild("1"));
		using session = await createSession(host);
		const initial = await session.lintFiles(session.allFilePaths);
		expect(getLanguageReportCodes(initial)).toContain("TS2322");
		const appResults = initial.get(appPath);
		expect(Array.from(appResults?.dependencies ?? [])).toContain(childPath);
		expect(Array.from(appResults?.missingDependencies ?? [])).not.toContain(
			`${root}/src/Child.d.vue.ts`,
		);

		host.vfsUpsertFile(childPath, createChild('"text"'));
		const results = await session.lintChangedFiles([childPath]);

		expect(results.has(appPath)).toBe(true);
		expect(getLanguageReportCodes(results)).not.toContain("TS2322");
	});
});

function createChild(value: string): string {
	return `<script lang="ts">\nexport const extra = ${value};\nexport default {};\n</script>\n`;
}

async function createSession(host: VFSLinterHost): Promise<LintSession> {
	return await LintSession.create(
		{
			filePath: `${root}/flint.config.ts`,
			use: [{ files: ["src/App.vue"], rules: [rule] }],
		},
		host,
	);
}

function createTestHost(): VFSLinterHost {
	const host = createVFSLinterHost({ caseSensitive: true, cwd: root });
	host.vfsUpsertFile(`${root}/flint.config.ts`, "");
	host.vfsUpsertFile(
		`${root}/package.json`,
		JSON.stringify({ type: "module" }),
	);
	host.vfsUpsertFile(
		`${root}/tsconfig.json`,
		JSON.stringify({
			compilerOptions: { module: "nodenext" },
			include: ["src"],
		}),
	);
	host.vfsUpsertFile(
		appPath,
		'<script lang="ts">\nimport { extra } from "./Child.vue";\nexport const text: string = extra;\nexport default {};\n</script>\n',
	);

	return host;
}

function getLanguageReportCodes(
	results: Map<string, { languageReports: { code?: string }[] }>,
): (string | undefined)[] {
	return Array.from(results.values()).flatMap((fileResults) =>
		fileResults.languageReports.map((report) => report.code),
	);
}
