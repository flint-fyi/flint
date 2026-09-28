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
					return;
				}
				return {
					...suggestion,
					range: sourceCodeRange(suggestion.range),
				};
			})
			.filter((suggestion) => suggestion !== undefined),
	});
}

/**
 * Marks a range as already being in authored-source coordinates, so the
 * TypeScript language passes it through instead of mapping it from the
 * virtual file. `begin` is stored as `-1 - begin`: a plain negation could not
 * represent offset 0, because `-0` is not less than 0.
 */
function sourceCodeRange(range: CharacterReportRange): CharacterReportRange {
	return {
		begin: -1 - range.begin,
		end: range.end,
	};
}
