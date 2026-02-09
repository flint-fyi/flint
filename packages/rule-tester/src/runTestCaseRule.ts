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
	type FileReport,
	type CharacterReportRange,
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

	using file = fileFactories.get(rule.language).createFile({
		filePath: fileName,
		filePathAbsolute,
		sourceText: code,
	});

	const reports: FileReport[] = [];

	const ruleRuntime = await rule.setup({
		report(ruleReport) {
			let range = ruleReport.range;
			let fixes =
				ruleReport.fix && !Array.isArray(ruleReport.fix)
					? [ruleReport.fix]
					: ruleReport.fix;
			let suggestions = ruleReport.suggestions;

			const { adjustReportRange } = file;
			if (adjustReportRange != null) {
				const r = adjustReportRange(ruleReport.range);
				if (r == null) {
					return;
				}
				range = r;
				if (fixes != null) {
					fixes = fixes
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
				}
				if (suggestions != null) {
					suggestions = suggestions
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
			}

			reports.push({
				...ruleReport,
				fix: fixes,
				suggestions,
				about: rule.about,
				message: nullThrows(
					rule.messages[ruleReport.message],
					`Message should be defined (${ruleReport.message}) when reporting for rule "${rule.about.id}"`,
				),
				range: {
					begin: getColumnAndLineOfPosition(file.about.sourceText, range.begin),
					end: getColumnAndLineOfPosition(file.about.sourceText, range.end),
				},
			});
		},
	});

	if (ruleRuntime) {
		rule.language.runFileVisitors(file, options, ruleRuntime);
		await ruleRuntime.teardown?.();
	}

	return reports;
}
