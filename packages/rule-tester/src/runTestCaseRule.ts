import {
	type AnyLanguage,
	type AnyLanguageFileFactory,
	type AnyOptionalSchema,
	type AnyRule,
	type FileReport,
	type InferredOutputObject,
	type NormalizedReport,
	processRuleReport,
	type RuleAbout,
	type VFSLinterHost,
} from "@flint.fyi/core";
import { normalizePath, pathKey } from "@flint.fyi/utils";
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
			path.resolve(linterHost.getCurrentDirectory(), name),
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
		rule.language.runFileVisitors(file, options, ruleRuntime);
		await ruleRuntime.teardown?.();
	}

	return reports;
}
