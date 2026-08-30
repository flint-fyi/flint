import { describe, expect, it } from "vitest";

import { createVFSLinterHost, type VFSLinterHost } from "@flint.fyi/core";

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
