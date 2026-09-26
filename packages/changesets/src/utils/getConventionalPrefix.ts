import type { Paragraph } from "mdast";

import type { WithPosition } from "@flint.fyi/markdown-language";

const conventionalPrefixPattern =
	/^(?:build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(?:\([^)]*\))?!?:[ \t]+/i;

export function getConventionalPrefix(
	paragraph: WithPosition<Paragraph>,
	sourceText: string,
): string | undefined {
	return conventionalPrefixPattern.exec(
		sourceText.slice(
			paragraph.position.start.offset,
			paragraph.position.end.offset,
		),
	)?.[0];
}
