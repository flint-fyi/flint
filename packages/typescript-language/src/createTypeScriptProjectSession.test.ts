import { describe, expect, it } from "vitest";

import { createVFSLinterHost, type VFSLinterHost } from "@flint.fyi/core";

import { registerTypeScriptContentMapper } from "./contentMappers.ts";
import { createTypeScriptProjectSession } from "./createTypeScriptProjectSession.ts";

const configFilePath = "/repo/tsconfig.json";
const indexFilePath = "/repo/src/index.ts";

function createHost(): VFSLinterHost {
	const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
	host.vfsUpsertFile(
		configFilePath,
		JSON.stringify({
			compilerOptions: { noLib: true, strict: true },
			include: ["src"],
		}),
	);
	host.vfsUpsertFile(indexFilePath, "export const value = 1;");
	return host;
}

describe(createTypeScriptProjectSession, () => {
	it("opens files and resolves their default projects", () => {
		using session = createTypeScriptProjectSession(createHost());

		const snapshot = session.update({ openFiles: [indexFilePath] });

		expect(session.getSnapshot()).toBe(snapshot);
		expect(
			snapshot.getDefaultProjectForFile(indexFilePath)?.configFileName,
		).toBe(configFilePath);
	});

	it("opens configured projects directly", () => {
		using session = createTypeScriptProjectSession(createHost());

		const snapshot = session.update({ openProjects: [configFilePath] });

		expect(
			snapshot.getProject(configFilePath)?.program.getSourceFile(indexFilePath)
				?.text,
		).toBe("export const value = 1;");
	});

	it("opens virtual overlays for authored projects when mappers are registered", () => {
		const host = createHost();
		const authoredConfig = host.readFileSync(configFilePath);
		using unregister = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				extensions: [".vue"],
				packageName: "unresolved-mapper-is-not-run-without-mapped-files",
			}),
		};
		using session = createTypeScriptProjectSession(host);

		const snapshot = session.update({ openProjects: [configFilePath] });
		const [project] = snapshot.getProjects();

		expect(project?.configFileName).toMatch(
			/^\/repo\/node_modules\/\.cache\/flint\/typescript-overlays\//,
		);
		expect(project?.program.getSourceFile(indexFilePath)?.text).toBe(
			"export const value = 1;",
		);
		expect(host.readFileSync(project?.configFileName ?? "")).toBeUndefined();
		expect(host.readFileSync(configFilePath)).toBe(authoredConfig);
	});

	it("parses JSONC natively and keeps inherited includes relative to the authored configs", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		const appConfigFilePath = "/repo/packages/app/tsconfig.json";
		const appFilePath = "/repo/packages/app/src/app.ts";
		host.vfsUpsertFile(
			"/repo/config/base.json",
			'{ // relative to this base config\n "include": ["../packages/app/src"] }',
		);
		host.vfsUpsertFile(
			appConfigFilePath,
			'{ // JSONC must be parsed by tsgo\n "extends": "../../config/base.json", "compilerOptions": { "noLib": true } }',
		);
		host.vfsUpsertFile(appFilePath, "export const app = true;");
		using unregister = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				extensions: [".vue"],
				packageName: "unused-mapper",
			}),
		};
		using session = createTypeScriptProjectSession(host);

		const snapshot = session.update({ openProjects: [appConfigFilePath] });
		const [project] = snapshot.getProjects();

		expect(project?.program.getSourceFile(appFilePath)?.text).toBe(
			"export const app = true;",
		);
	});

	it("resolves referenced projects and copied relative reference paths", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		const appConfigFilePath = "/repo/packages/app/tsconfig.json";
		const coreConfigFilePath = "/repo/packages/core/tsconfig.json";
		const coreFilePath = "/repo/packages/core/core.ts";
		host.vfsUpsertFile(
			appConfigFilePath,
			JSON.stringify({
				compilerOptions: { noLib: true },
				files: [],
				references: [{ path: "../core" }],
			}),
		);
		host.vfsUpsertFile(
			coreConfigFilePath,
			JSON.stringify({ compilerOptions: { composite: true, noLib: true } }),
		);
		host.vfsUpsertFile(coreFilePath, "export const core = true;");
		using unregister = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				extensions: [".vue"],
				packageName: "unused-mapper",
			}),
		};
		using session = createTypeScriptProjectSession(host);

		const snapshot = session.update({ openProjects: [appConfigFilePath] });
		const [project] = snapshot.getProjects();

		expect(project?.parsedCommandLine.projectReferences).toEqual([
			expect.objectContaining({ path: "/repo/packages/core" }),
		]);
	});

	it("refreshes mapper registrations after an existing session is updated", () => {
		const host = createHost();
		using session = createTypeScriptProjectSession(host);
		session.update({ openProjects: [configFilePath] });
		const unregister = registerTypeScriptContentMapper({
			extensions: [".vue"],
			packageName: "unused-mapper",
		});

		const mappedSnapshot = session.update({ openProjects: [configFilePath] });
		const mappedProject = session.getProjectForFile("/repo/src/component.vue");

		expect(mappedProject?.configFileName).toMatch(/typescript-overlays/);
		expect(mappedProject?.program.getSourceFile(indexFilePath)?.text).toBe(
			"export const value = 1;",
		);
		expect(mappedSnapshot.getProjects()).toContain(mappedProject);

		expect(unregister()).toBe(true);
		const authoredSnapshot = session.update({ openProjects: [configFilePath] });
		expect(authoredSnapshot.getProject(configFilePath)).toBeDefined();
		expect(session.getProjectForFile(indexFilePath)).toBe(
			authoredSnapshot.getDefaultProjectForFile(indexFilePath),
		);
	});

	it("reopens authored projects when mappers are removed without repeated open projects", () => {
		const host = createHost();
		const unregister = registerTypeScriptContentMapper({
			extensions: [".vue"],
			packageName: "unused-mapper",
		});
		using session = createTypeScriptProjectSession(host);
		session.update({ openProjects: [configFilePath] });

		expect(unregister()).toBe(true);
		const snapshot = session.update({});

		expect(snapshot.getProject(configFilePath)).toBeDefined();
		expect(session.getProjectForFile(indexFilePath)).toBe(
			snapshot.getDefaultProjectForFile(indexFilePath),
		);
	});

	it("continues parsing an authored config through repeated edits", () => {
		const host = createHost();
		using unregister = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				extensions: [".vue"],
				packageName: "unused-mapper",
			}),
		};
		using session = createTypeScriptProjectSession(host);
		session.update({ openProjects: [configFilePath] });

		for (let revision = 0; revision < 20; revision += 1) {
			host.vfsUpsertFile(
				configFilePath,
				`{ // revision ${revision}\n "compilerOptions": { "noLib": true }, "include": ["src"] }`,
			);
			const snapshot = session.update({ changed: [configFilePath] });
			expect(snapshot.getProjects()).toHaveLength(1);
		}
	});

	it("refreshes overlay references when an authored config changes", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		const firstConfigFilePath = "/repo/first/tsconfig.json";
		const secondConfigFilePath = "/repo/second/tsconfig.json";
		for (const referencedConfigFilePath of [
			firstConfigFilePath,
			secondConfigFilePath,
		]) {
			host.vfsUpsertFile(
				referencedConfigFilePath,
				JSON.stringify({ compilerOptions: { composite: true, noLib: true } }),
			);
		}
		host.vfsUpsertFile(
			configFilePath,
			JSON.stringify({ files: [], references: [{ path: "./first" }] }),
		);
		using unregister = {
			[Symbol.dispose]: registerTypeScriptContentMapper({
				extensions: [".vue"],
				packageName: "unused-mapper",
			}),
		};
		using session = createTypeScriptProjectSession(host);
		const firstSnapshot = session.update({ openProjects: [configFilePath] });
		expect(
			firstSnapshot.getProjects()[0]?.parsedCommandLine.projectReferences,
		).toEqual([expect.objectContaining({ path: "/repo/first" })]);
		host.vfsUpsertFile(
			configFilePath,
			JSON.stringify({ files: [], references: [{ path: "./second" }] }),
		);

		const secondSnapshot = session.update({ changed: [configFilePath] });

		expect(
			secondSnapshot
				.getProjects()
				.find((project) =>
					project.configFileName.includes("typescript-overlays"),
				)?.parsedCommandLine.projectReferences,
		).toEqual([expect.objectContaining({ path: "/repo/second" })]);
	});

	it("uses default lookup when no registered extension applies", () => {
		using session = createTypeScriptProjectSession(createHost());
		const snapshot = session.update({ openFiles: [indexFilePath] });

		expect(session.getProjectForFile(indexFilePath)).toBe(
			snapshot.getDefaultProjectForFile(indexFilePath),
		);
	});

	it("replaces snapshots and propagates changed files", () => {
		const host = createHost();
		using session = createTypeScriptProjectSession(host);
		const first = session.update({ openProjects: [configFilePath] });
		const firstProject = first.getProject(configFilePath);
		expect(firstProject).toBeDefined();
		if (!firstProject) {
			throw new Error("Expected the configured project to be open.");
		}
		const firstChecker = firstProject.checker;
		host.vfsUpsertFile(indexFilePath, "export const value = 2;");

		const second = session.update({ changed: [indexFilePath] });

		expect(second).not.toBe(first);
		expect(
			second.getProject(configFilePath)?.program.getSourceFile(indexFilePath)
				?.text,
		).toBe("export const value = 2;");
		expect(first.isDisposed()).toBe(true);
		expect(() => first.getProjects()).toThrow(/disposed/i);
		expect(() => firstProject.program.getSourceFile(indexFilePath)).toThrow();
		expect(() => firstChecker.getTypeAtPosition(indexFilePath, 0)).toThrow();
	});

	it("propagates created files", () => {
		const host = createHost();
		using session = createTypeScriptProjectSession(host);
		session.update({ openProjects: [configFilePath] });
		const createdFilePath = "/repo/src/created.ts";
		host.vfsUpsertFile(createdFilePath, "export const created = true;");

		const snapshot = session.update({ created: [createdFilePath] });

		expect(
			snapshot
				.getProject(configFilePath)
				?.program.getSourceFile(createdFilePath)?.text,
		).toBe("export const created = true;");
	});

	it("propagates deleted files", () => {
		const host = createHost();
		const deletedFilePath = "/repo/src/deleted.ts";
		host.vfsUpsertFile(deletedFilePath, "export const deleted = true;");
		using session = createTypeScriptProjectSession(host);
		session.update({ openProjects: [configFilePath] });
		host.vfsDeleteFile(deletedFilePath);

		const snapshot = session.update({ deleted: [deletedFilePath] });

		expect(
			snapshot
				.getProject(configFilePath)
				?.program.getSourceFile(deletedFilePath),
		).toBeUndefined();
	});

	it("disposes the current snapshot and tolerates repeated disposal", () => {
		const session = createTypeScriptProjectSession(createHost());
		const snapshot = session.update({ openFiles: [indexFilePath] });

		session[Symbol.dispose]();

		expect(snapshot.isDisposed()).toBe(true);
		expect(() => {
			session[Symbol.dispose]();
		}).not.toThrow();
	});
});
