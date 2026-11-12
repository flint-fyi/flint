import type { Paragraph } from "mdast";

import type { WithPosition } from "@flint.fyi/markdown-language";

const conventionalPrefixPattern = /^(\w+)(?:\([^)]*\))?!?:[ \t]+/;

// Matches DEFAULT_COMMIT_TYPES from conventional-changelog-conventionalcommits.
export const defaultConventionalTypes = [
	"build",
	"chore",
	"ci",
	"docs",
	"feat",
	"feature",
	"fix",
	"perf",
	"refactor",
	"revert",
	"style",
	"test",
];

export function getConventionalPrefix(
	paragraph: WithPosition<Paragraph>,
	sourceText: string,
	types: readonly string[] = defaultConventionalTypes,
): string | undefined {
	const match = conventionalPrefixPattern.exec(
		sourceText.slice(
			paragraph.position.start.offset,
			paragraph.position.end.offset,
		),
	);
	if (!match?.[1]) {
		return undefined;
	}

	const type = match[1].toLowerCase();

	return types.some((candidate) => candidate.toLowerCase() === type)
		? match[0]
		: undefined;
}
