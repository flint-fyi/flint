import type { Project } from "./native/sync.ts";

// The ID TypeScript gives the project it synthesizes for files that no
// tsconfig contains. It is not exposed by the API, only by convention.
const inferredProjectId = "/dev/null/inferred";

export function isInferredProject(project: Pick<Project, "id">): boolean {
	return project.id === inferredProjectId;
}
