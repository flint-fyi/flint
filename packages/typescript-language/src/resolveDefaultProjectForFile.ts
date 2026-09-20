import type { Project, Snapshot } from "typescript-native/unstable/sync";

import { isInferredProject } from "./isInferredProject.ts";

export type DefaultProjectResolver = (
	snapshot: Snapshot,
	filePath: string,
) => Project | undefined;

/**
 * Creates a resolver for the project TypeScript treats as a file's default.
 *
 * TypeScript answers `getDefaultProjectForFile` with the whole project: every
 * root file name (twice) plus its options. Asking once per linted file makes
 * a lint pass cost O(files²) in serialized JSON. Its own answer, though, is a
 * containment check across the configured projects: a file contained by
 * exactly one of them belongs to it. Those containments are fetched once per
 * project per snapshot instead, and only the ambiguous cases — no containing
 * project, or several — are deferred to TypeScript.
 */
export function createDefaultProjectResolver(
	getCanonicalFileName: (fileName: string) => string,
): DefaultProjectResolver {
	let cachedSnapshot: Snapshot | undefined;
	let sourceFileNamesByProject: Map<Project, Set<string>> | undefined;

	return (snapshot, filePath) => {
		if (snapshot !== cachedSnapshot) {
			cachedSnapshot = snapshot;
			sourceFileNamesByProject = undefined;
		}
		sourceFileNamesByProject ??= new Map(
			snapshot
				.getProjects()
				.filter((project) => !isInferredProject(project))
				.map((project) => [
					project,
					new Set(
						project.program.getSourceFileNames().map(getCanonicalFileName),
					),
				]),
		);

		const canonicalFilePath = getCanonicalFileName(filePath);
		let containingProject: Project | undefined;
		for (const [project, sourceFileNames] of sourceFileNamesByProject) {
			if (!sourceFileNames.has(canonicalFilePath)) {
				continue;
			}
			if (containingProject) {
				return snapshot.getDefaultProjectForFile(filePath);
			}
			containingProject = project;
		}

		return containingProject ?? snapshot.getDefaultProjectForFile(filePath);
	};
}
