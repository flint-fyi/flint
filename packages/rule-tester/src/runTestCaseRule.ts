import {
	type AnyLanguage,
	type AnyLanguageFileFactory,
	type AnyOptionalSchema,
	type AnyRule,
	getColumnAndLineOfPosition,
	type InferredOutputObject,
	type NormalizedReport,
	normalizePath,
	type RuleAbout,
	type VFSLinterHost,
} from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";
import type { CachedFactory } from "cached-factory";
import assert from "node:assert/strict";
import path from "node:path";

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
	linterHost: VFSLinterHost,
	{ options, rule }: Required<TestCaseRuleConfiguration<OptionsSchema>>,
	{ code, fileName, files }: TestCaseNormalized,
): Promise<NormalizedReport[]> {
	const filePathAbsolute = normalizePath(
		path.resolve(linterHost.getCurrentDirectory(), fileName),
		linterHost.isCaseSensitiveFS(),
	);
	for (const oldFile of linterHost.vfsListFiles().keys()) {
		if (oldFile !== filePathAbsolute) {
			linterHost.vfsDeleteFile(oldFile);
		}
	}
	for (const [name, content] of Object.entries(files ?? {})) {
		const filePath = normalizePath(
			path.resolve(linterHost.getCurrentDirectory(), name),
			linterHost.isCaseSensitiveFS(),
		);
		assert.notEqual(
			filePath,
			filePathAbsolute,
			`Expected 'files' not to shadow '${fileName}'`,
		);
		linterHost.vfsUpsertFile(filePath, content);
	}
	linterHost.vfsUpsertFile(filePathAbsolute, code);

	using file = fileFactories.get(rule.language).prepareFile({
		filePath: fileName,
		filePathAbsolute,
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
