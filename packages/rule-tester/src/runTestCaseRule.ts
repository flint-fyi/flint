import assert from "node:assert/strict";

import type { CachedFactory } from "cached-factory";
import { resolve } from "pathe";

import {
	processRuleReport,
	type AnyOptionalSchema,
	type AnyRule,
	type FileReport,
	type InferredInputObject,
	type LanguageBase,
	type LanguageFileFactory,
	type LanguageReport,
	type RuleAbout,
	type VFSLinterHost,
} from "@flint.fyi/core";
import { normalizePath, pathKey } from "@flint.fyi/utils";

import type { TestCaseNormalized } from "./normalizeTestCase.ts";

export interface RunTestCaseRuleOptions {
	collectLanguageReports?: boolean;
}

export interface TestCaseRuleConfiguration<
	OptionsSchema extends AnyOptionalSchema | undefined,
> {
	options: InferredInputObject<OptionsSchema> | undefined;
	rule: AnyRule<RuleAbout, OptionsSchema>;
}

export async function runTestCaseRule<
	OptionsSchema extends AnyOptionalSchema | undefined,
>(
	fileFactories: CachedFactory<LanguageBase, LanguageFileFactory>,
	linterHost: VFSLinterHost,
	{ options, rule }: TestCaseRuleConfiguration<OptionsSchema>,
	{ code, fileName, files }: TestCaseNormalized,
	{ collectLanguageReports = false }: RunTestCaseRuleOptions = {},
): Promise<{ languageReports: LanguageReport[]; reports: FileReport[] }> {
	const filePathAbsolute = normalizePath(
		resolve(linterHost.getCurrentDirectory(), fileName),
	);
	const caseSensitive = linterHost.isCaseSensitiveFS();
	const targetKey = pathKey(filePathAbsolute, caseSensitive);
	for (const oldFile of linterHost.vfsListFiles().keys()) {
		if (pathKey(oldFile, caseSensitive) !== targetKey) {
			linterHost.vfsDeleteFile(oldFile);
		}
	}
	for (const [name, content] of Object.entries(files ?? {})) {
		const filePath = normalizePath(
			resolve(linterHost.getCurrentDirectory(), name),
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
		host: linterHost,
		report(ruleReport) {
			const processedReport = processRuleReport(file, rule, ruleReport);
			if (processedReport == null) {
				return;
			}
			reports.push(processedReport);
		},
	});

	if (ruleRuntime) {
		if (ruleRuntime.addFileVisitors) {
			ruleRuntime.addFileVisitors(file, options);
			file.runFileVisitors();
		}

		await ruleRuntime.teardown?.();
	}

	return {
		languageReports: collectLanguageReports
			? (file.getLanguageReports?.(linterHost) ?? [])
			: [],
		reports: reports.toSorted(
			(a, b) =>
				a.range.begin.raw - b.range.begin.raw ||
				a.range.end.raw - b.range.end.raw,
		),
	};
}
