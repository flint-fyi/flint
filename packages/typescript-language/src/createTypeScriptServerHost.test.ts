import { createProjectService } from "@typescript-eslint/project-service";
import { beforeEach, describe, expect, it } from "vitest";

import { createVFSLinterHost, type VFSLinterHost } from "@flint.fyi/core";

import { createTypeScriptServerHost } from "./createTypeScriptServerHost.ts";
import { createRuleTesterTSConfig } from "./utils/createRuleTesterTSConfig.ts";

const root = "/virtual";

describe(createTypeScriptServerHost, () => {
	let host: VFSLinterHost;

	beforeEach(() => {
		host = createVFSLinterHost({ caseSensitive: true, cwd: root });

		for (const [fileName, content] of Object.entries(
			createRuleTesterTSConfig(),
		)) {
			host.vfsUpsertFile(`${root}/${fileName}`, content);
		}

		host.vfsUpsertFile(
			`${root}/src/index.ts`,
			'import { value } from "./nested/value.ts";\nexport const doubled = value * 2;\n',
		);
		host.vfsUpsertFile(
			`${root}/src/nested/value.ts`,
			"export const value = 1;\n",
		);
		host.vfsUpsertFile(`${root}/src/styles.css`, "");
		host.vfsUpsertFile(`${root}/node_modules/ignored/index.ts`, "");
	});

	it("answers file system queries from the host", () => {
		const serverHost = createTypeScriptServerHost(host);

		expect(serverHost.useCaseSensitiveFileNames).toBe(true);
		expect(serverHost.getCurrentDirectory()).toBe(root);
		expect(serverHost.fileExists("src/index.ts")).toBe(true);
		expect(serverHost.directoryExists(`${root}/src/nested`)).toBe(true);
		expect(serverHost.readFile(`${root}/src/nested/value.ts`)).toBe(
			"export const value = 1;\n",
		);
		expect(serverHost.getDirectories(root)).toEqual(["node_modules", "src"]);
	});

	it("matches directory contents without a Node file system", () => {
		const serverHost = createTypeScriptServerHost(host);

		expect(
			serverHost.readDirectory(
				root,
				[".ts"],
				["**/node_modules/**"],
				["src/**/*"],
				undefined,
			),
		).toEqual([`${root}/src/index.ts`, `${root}/src/nested/value.ts`]);
	});

	it("treats missing directories as empty", () => {
		const serverHost = createTypeScriptServerHost(host);

		expect(serverHost.getDirectories(`${root}/missing`)).toEqual([]);
		expect(
			serverHost.readDirectory(
				`${root}/missing`,
				[".ts"],
				undefined,
				["**/*"],
				undefined,
			),
		).toEqual([]);
	});

	it("serves a project service from the host alone", () => {
		const { service } = createProjectService({
			host: createTypeScriptServerHost(host),
		});
		const filePath = `${root}/src/index.ts`;

		service.openClientFile(filePath);

		const scriptInfo = service.getScriptInfo(filePath);
		const project =
			scriptInfo && service.getDefaultProjectForFile(scriptInfo.fileName, true);
		const program = project?.getLanguageService(true).getProgram();

		expect(program?.getSourceFile(filePath)?.text).toContain("doubled");
		expect(program?.getSourceFile(`${root}/src/nested/value.ts`)).toBeDefined();
	});
});
