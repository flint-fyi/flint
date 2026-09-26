import type { CommitType } from "conventional-changelog-conventionalcommits";

declare module "conventional-changelog-conventionalcommits" {
	export const DEFAULT_COMMIT_TYPES: readonly CommitType[];
}
