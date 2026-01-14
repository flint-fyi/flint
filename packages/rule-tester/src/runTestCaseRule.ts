import {
	type AnyLanguage,
	type AnyLanguageFileFactory,
	type AnyOptionalSchema,
	type AnyRule,
	getColumnAndLineOfPosition,
	type InferredOutputObject,
	type NormalizedReport,
	type RuleAbout,
} from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";
import type { CachedFactory } from "cached-factory";

import type { TestCaseNormalized } from "./normalizeTestCase.ts";

export interface TestCaseRuleConfiguration<
	OptionsSchema extends AnyOptionalSchema | undefined,
> {
	options?: InferredOutputObject<OptionsSchema | undefined>;
	rule: AnyRule<RuleAbout, OptionsSchema>;
}

export async function runTestCaseRule<
	OptionsSchema extends AnyOptionalSchema | undefined,
>(
	fileFactories: CachedFactory<AnyLanguage, AnyLanguageFileFactory>,
	{ options, rule }: Required<TestCaseRuleConfiguration<OptionsSchema>>,
	{ code, fileName }: TestCaseNormalized,
): Promise<NormalizedReport[]> {
	using file = fileFactories.get(rule.language).prepareFromVirtual({
		filePath: fileName,
		filePathAbsolute: fileName,
		sourceText: code,
	}).file;

	const reports: NormalizedReport[] = [];

	const ruleRuntime = await rule.setup({
		report(ruleReport) {
			reports.push({
				...ruleReport,
				fix:
					ruleReport.fix && !Array.isArray(ruleReport.fix)
						? [ruleReport.fix]
						: ruleReport.fix,
				message: nullThrows(
					rule.messages[ruleReport.message],
					`Message should be defined (${ruleReport.message}) when reporting for rule "${rule.about.id}"`,
				),
				range: {
					begin: getColumnAndLineOfPosition(
						file.about.sourceText,
						ruleReport.range.begin,
					),
					end: getColumnAndLineOfPosition(
						file.about.sourceText,
						ruleReport.range.end,
					),
				},
			});
		},
	});

	if (ruleRuntime) {
		file.runVisitors(options, ruleRuntime);

		await ruleRuntime.teardown?.();
	}

	return reports;
}
