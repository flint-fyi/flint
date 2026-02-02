import { nullThrows } from "@flint.fyi/utils";

import type { AnyLanguageFile } from "../types/languages.ts";
import type { RuleReport } from "../types/reports.ts";
import type { AnyRule } from "../types/rules.ts";
import { getColumnAndLineOfPosition } from "../utils/getColumnAndLineOfPosition.ts";

/**
 * Joins rule report data with data from the file being linted and parent rule.
 */
export function processRuleReport(
	currentFile: AnyLanguageFile,
	rule: AnyRule,
	ruleReport: RuleReport,
) {
	return {
		...ruleReport,
		about: {
			...rule.about,
			id: rule.about.pluginId
				? `${rule.about.pluginId}/${rule.about.id}`
				: rule.about.id,
		},
		fix:
			ruleReport.fix && !Array.isArray(ruleReport.fix)
				? [ruleReport.fix]
				: ruleReport.fix,
		message: nullThrows(
			rule.messages[ruleReport.message],
			`Rule "${rule.about.id}" reported message "${ruleReport.message}" which is not defined in its messages.`,
		),
		range: {
			begin: getColumnAndLineOfPosition(
				currentFile.about.sourceText,
				ruleReport.range.begin,
			),
			end: getColumnAndLineOfPosition(
				currentFile.about.sourceText,
				ruleReport.range.end,
			),
		},
	};
}
