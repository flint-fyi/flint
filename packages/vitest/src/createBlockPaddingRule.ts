import {
	createStatementPaddingRule,
	getStatementRootName,
} from "./createStatementPaddingRule.ts";
import type { VitestRuleAbout } from "./ruleCreator.ts";

export function createBlockPaddingRule(
	about: VitestRuleAbout,
	targetNames: string | string[],
	options?: {
		blockName?: string;
		ignoreConsecutiveTargetNames?: boolean;
	},
) {
	const normalizedTargetNames: string[] = Array.isArray(targetNames)
		? targetNames
		: [targetNames];
	const targetNameSet = new Set(normalizedTargetNames);
	const firstTargetName = normalizedTargetNames[0];
	const blockName = options?.blockName ?? firstTargetName ?? about.id;

	return createStatementPaddingRule(
		about,
		(statement) => {
			const rootName = getStatementRootName(statement);
			if (!rootName || !targetNameSet.has(rootName)) {
				return undefined;
			}

			return {
				blockName,
				category: rootName,
			};
		},
		(previousMatch, nextMatch) => {
			if (!previousMatch && !nextMatch) {
				return false;
			}

			if (
				options?.ignoreConsecutiveTargetNames &&
				previousMatch?.category === nextMatch?.category
			) {
				return false;
			}

			return true;
		},
	);
}
