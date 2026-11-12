import type { Root, RootContent, Yaml } from "mdast";

import type { WithPosition } from "@flint.fyi/markdown-language";

export interface ChangesetSummary {
	frontmatter: WithPosition<Yaml>;
	nodes: WithPosition<RootContent>[];
}

export function getChangesetSummary(
	root: WithPosition<Root>,
): ChangesetSummary | undefined {
	const [frontmatter, ...nodes] = root.children as WithPosition<RootContent>[];

	if (frontmatter?.type !== "yaml" || !frontmatter.value.trim()) {
		return undefined;
	}

	return { frontmatter, nodes };
}
