import type { Root, RootContent, Yaml } from "mdast";

import type { WithPosition } from "@flint.fyi/markdown-language";

export interface ChangesetSummary {
	frontmatter: WithPosition<Yaml>;
	nodes: WithPosition<RootContent>[];
}

/**
 * Retrieves the frontmatter and the summary nodes after it from a changeset file.
 * Files without frontmatter, such as a README.md, are not changesets.
 * Changesets with empty frontmatter are created by `changeset add --empty` and have no summary.
 */
export function getChangesetSummary(
	root: WithPosition<Root>,
): ChangesetSummary | undefined {
	const [frontmatter, ...nodes] = root.children as WithPosition<RootContent>[];

	if (frontmatter?.type !== "yaml" || !frontmatter.value.trim()) {
		return undefined;
	}

	return { frontmatter, nodes };
}
