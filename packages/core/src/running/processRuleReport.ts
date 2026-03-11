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
	let range = ruleReport.range;
	let fix =
		ruleReport.fix && !Array.isArray(ruleReport.fix)
			? [ruleReport.fix]
			: ruleReport.fix;
	let suggestions = ruleReport.suggestions;
	const { adjustReportRange } = currentFile;
	if (adjustReportRange != null) {
		const adjustedRange = adjustReportRange(ruleReport.range);
		if (adjustedRange == null) {
			return null;
		}
		range = adjustedRange;
		fix &&= fix
			.map((fix) => {
				const range = adjustReportRange(fix.range);
				return (
					range && {
						...fix,
						range,
					}
				);
			})
			.filter((f) => f != null);

		suggestions &&= suggestions
			.map((s) => {
				if ("files" in s) {
					// TODO: support cross-file suggestions
					return null;
				}
				const range = adjustReportRange(s.range);
				return (
					range && {
						...s,
						range,
					}
				);
			})
			.filter((s) => s != null);
	}

	return {
		...ruleReport,
		about: {
			...rule.about,
			id: rule.about.pluginId
				? `${rule.about.pluginId}/${rule.about.id}`
				: rule.about.id,
		},
		fix,
		message: nullThrows(
			rule.messages[ruleReport.message],
			`Rule "${rule.about.id}" reported message "${ruleReport.message}" which is not defined in its messages.`,
		),
		range: {
			begin: getColumnAndLineOfPosition(
				currentFile.about.sourceText,
				range.begin,
			),
			end: getColumnAndLineOfPosition(currentFile.about.sourceText, range.end),
		},
		suggestions,
	};
}
