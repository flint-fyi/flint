import type { Project } from "typescript-native/unstable/sync";

// The name TypeScript gives the project it synthesizes for files that no
// tsconfig contains. It is not exposed by the API, only by convention.
const inferredProjectConfigFileName = "/dev/null/inferred";

export function isInferredProject(
	project: Pick<Project, "configFileName">,
): boolean {
	return project.configFileName === inferredProjectConfigFileName;
}
