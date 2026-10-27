import {
	createStatementPaddingRule,
	parseStatementVitestFunctionCall,
	type StatementPaddingRule,
} from "./createStatementPaddingRule.ts";
import type { VitestRuleAbout } from "./ruleCreator.ts";
import type { VitestFunctionName } from "./utils/parseVitestFunctionCall.ts";

export function createBlockPaddingRule(
	about: VitestRuleAbout,
	targetNames: VitestFunctionName | VitestFunctionName[],
	options?: {
		blockName?: string;
		ignoreConsecutiveTargetNames?: boolean;
	},
): StatementPaddingRule {
	const normalizedTargetNames: VitestFunctionName[] = Array.isArray(targetNames)
		? targetNames
		: [targetNames];
	const targetNameSet = new Set(normalizedTargetNames);
	const firstTargetName = normalizedTargetNames[0];
	const blockName = options?.blockName ?? firstTargetName ?? about.id;

	return createStatementPaddingRule(
		about,
		(statement) => {
			const call = parseStatementVitestFunctionCall(statement);
			if (!call || !targetNameSet.has(call.name)) {
				return;
			}

			return {
				blockName,
				category: call.name,
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
