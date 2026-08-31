import {
	isSuggestionForFiles,
	type CharacterReportRange,
	type RuleContext,
	type RuleReport,
} from "@flint.fyi/core";

export function reportSourceCode<T extends string>(
	context: RuleContext<T>,
	report: RuleReport<T>,
): void {
	context.report({
		...report,
		fix: (report.fix && !Array.isArray(report.fix)
			? [report.fix]
			: report.fix
		)?.map((change) => ({
			...change,
			range: sourceCodeRange(change.range),
		})),
		range: sourceCodeRange(report.range),
		suggestions: report.suggestions
			?.map((suggestion) => {
				if (isSuggestionForFiles(suggestion)) {
					return undefined;
				}
				return {
					...suggestion,
					range: sourceCodeRange(suggestion.range),
				};
			})
			.filter((suggestion) => suggestion !== undefined),
	});
}

function sourceCodeRange(range: CharacterReportRange): CharacterReportRange {
	return {
		begin: -range.begin,
		end: range.end,
	};
}
