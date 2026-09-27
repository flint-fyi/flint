import type { Project, Snapshot } from "typescript-native/unstable/sync";
import { describe, expect, it, vi } from "vitest";

import { createDefaultProjectResolver } from "./resolveDefaultProjectForFile.ts";

const sourceFileNamesByProject = new WeakMap<Project, string[]>();

function createProject(
	configFileName: string,
	sourceFileNames: string[],
): Project {
	const project = {
		configFileName,
		program: { getSourceFileNames: vi.fn(() => sourceFileNames) },
	} as unknown as Project;
	sourceFileNamesByProject.set(project, sourceFileNames);
	return project;
}

function createSnapshot(projects: Project[]) {
	// Stands in for TypeScript's own resolution, which does not go through the
	// program's source file names request.
	const getDefaultProjectForFile = vi.fn(
		(filePath: string): Project | undefined =>
			projects.find((project) =>
				sourceFileNamesByProject.get(project)?.includes(filePath),
			),
	);
	return {
		getDefaultProjectForFile,
		snapshot: {
			getDefaultProjectForFile,
			getProjects: () => projects,
		} as unknown as Snapshot,
	};
}

const toLowerCase = (fileName: string) => fileName.toLowerCase();

describe(createDefaultProjectResolver, () => {
	it("answers from a project's source file names without asking TypeScript", () => {
		const project = createProject("/repo/tsconfig.json", ["/repo/src/a.ts"]);
		const { getDefaultProjectForFile, snapshot } = createSnapshot([project]);
		const resolve = createDefaultProjectResolver(toLowerCase);

		expect(resolve(snapshot, "/repo/src/a.ts")).toBe(project);
		expect(getDefaultProjectForFile).not.toHaveBeenCalled();
	});

	it("compares canonical file names", () => {
		const project = createProject("/repo/tsconfig.json", ["/repo/src/a.ts"]);
		const { snapshot } = createSnapshot([project]);
		const resolve = createDefaultProjectResolver(toLowerCase);

		expect(resolve(snapshot, "/Repo/Src/A.ts")).toBe(project);
	});

	it("fetches each project's source file names once per snapshot", () => {
		const project = createProject("/repo/tsconfig.json", [
			"/repo/src/a.ts",
			"/repo/src/b.ts",
		]);
		const { snapshot } = createSnapshot([project]);
		const resolve = createDefaultProjectResolver(toLowerCase);

		resolve(snapshot, "/repo/src/a.ts");
		resolve(snapshot, "/repo/src/b.ts");

		expect(project.program.getSourceFileNames).toHaveBeenCalledTimes(1);

		const { snapshot: nextSnapshot } = createSnapshot([project]);
		resolve(nextSnapshot, "/repo/src/a.ts");

		expect(project.program.getSourceFileNames).toHaveBeenCalledTimes(2);
	});

	it("never answers with the inferred project itself", () => {
		const inferred = createProject("/dev/null/inferred", ["/repo/loose.ts"]);
		const { getDefaultProjectForFile, snapshot } = createSnapshot([inferred]);
		const resolve = createDefaultProjectResolver(toLowerCase);

		expect(resolve(snapshot, "/repo/loose.ts")).toBe(inferred);
		expect(inferred.program.getSourceFileNames).not.toHaveBeenCalled();
		expect(getDefaultProjectForFile).toHaveBeenCalledWith("/repo/loose.ts");
	});

	it("defers to TypeScript when no configured project contains the file", () => {
		const project = createProject("/repo/tsconfig.json", ["/repo/src/a.ts"]);
		const { getDefaultProjectForFile, snapshot } = createSnapshot([project]);
		const resolve = createDefaultProjectResolver(toLowerCase);

		expect(resolve(snapshot, "/repo/other.ts")).toBeUndefined();
		expect(getDefaultProjectForFile).toHaveBeenCalledWith("/repo/other.ts");
	});

	it("defers to TypeScript when several configured projects contain the file", () => {
		const shared = "/repo/src/shared.ts";
		const first = createProject("/repo/a/tsconfig.json", [shared]);
		const second = createProject("/repo/b/tsconfig.json", [shared]);
		const { getDefaultProjectForFile, snapshot } = createSnapshot([
			first,
			second,
		]);
		const resolve = createDefaultProjectResolver(toLowerCase);

		expect(resolve(snapshot, shared)).toBe(first);
		expect(getDefaultProjectForFile).toHaveBeenCalledWith(shared);
	});
});
