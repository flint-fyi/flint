import assert from "node:assert/strict";

import type { CachedFactory } from "cached-factory";
import { resolve } from "pathe";

import {
	processRuleReport,
	type AnyLanguage,
	type AnyLanguageFile,
	type AnyLanguageFileFactory,
	type AnyOptionalSchema,
	type AnyRule,
	type FileReport,
	type InferredOutputObject,
	type LanguageReport,
	type NormalizedReport,
	type RuleAbout,
	type VFSLinterHost,
} from "@flint.fyi/core";
import { normalizePath, pathKey } from "@flint.fyi/utils";

import type { TestCaseNormalized } from "./normalizeTestCase.ts";

export interface RunTestCaseRuleOptions {
	collectLanguageReports?: boolean;
}

export interface TestCaseReport extends NormalizedReport {
	fileName: string;
}

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
	{ auxiliaryFiles, lintedFiles }: TestCaseNormalized,
	{ collectLanguageReports = false }: RunTestCaseRuleOptions = {},
): Promise<{ languageReports: LanguageReport[]; reports: TestCaseReport[] }> {
	const caseSensitive = linterHost.isCaseSensitiveFS();
	const absolutePath = (filePath: string): string =>
		normalizePath(resolve(linterHost.getCurrentDirectory(), filePath));
	const keyForPath = (filePath: string): string =>
		pathKey(absolutePath(filePath), caseSensitive);
	const fileNamesByKey = new Map<string, string>();
	const allFiles = [
		...Object.entries(auxiliaryFiles),
		...Object.entries(lintedFiles),
	];
	for (const [fileName] of allFiles) {
		const key = keyForPath(fileName);
		assert.ok(
			!fileNamesByKey.has(key),
			`Test file paths '${fileNamesByKey.get(key)}' and '${fileName}' resolve to the same file.`,
		);
		fileNamesByKey.set(key, fileName);
	}

	for (const oldFile of linterHost.vfsListFiles().keys()) {
		if (!fileNamesByKey.has(pathKey(oldFile, caseSensitive))) {
			linterHost.vfsDeleteFile(oldFile);
		}
	}
	for (const [fileName, content] of allFiles) {
		linterHost.vfsUpsertFile(absolutePath(fileName), content);
	}

	using disposableFiles = new DisposableStack();
	const fileNames = Object.keys(lintedFiles);
	const orderedFileNames =
		rule.language.orderFilePaths?.(fileNames, linterHost) ?? fileNames;
	const filesByPath = new Map<string, AnyLanguageFile>();
	for (const fileName of orderedFileNames) {
		const sourceText = lintedFiles[fileName];
		assert.ok(sourceText !== undefined);
		const file = disposableFiles.use(
			fileFactories.get(rule.language).createFile({
				filePath: fileName,
				filePathAbsolute: absolutePath(fileName),
				sourceText,
			}),
		);
		filesByPath.set(fileName, file);
	}

	const reports: (FileReport & TestCaseReport)[] = [];
	let currentFile: AnyLanguageFile | undefined;
	const singleFile =
		filesByPath.size === 1 ? filesByPath.values().next().value : undefined;

	const ruleRuntime = await rule.setup({
		host: linterHost,
		report(ruleReport) {
			const targetFile =
				ruleReport.filePath === undefined
					? (currentFile ?? singleFile)
					: filesByPath.get(ruleReport.filePath);
			assert.ok(
				targetFile,
				`Rule '${rule.about.id}' reported on file '${ruleReport.filePath}' which is not part of the current test case.`,
			);
			const processedReport = processRuleReport(targetFile, rule, ruleReport);
			if (processedReport == null) {
				return;
			}
			reports.push({ ...processedReport, fileName: targetFile.about.filePath });
		},
	});

	if (ruleRuntime) {
		if (ruleRuntime.visitors) {
			for (const file of filesByPath.values()) {
				currentFile = file;
				rule.language.runFileVisitors(file, [
					{
						services: { options, ...file.services },
						visitors: ruleRuntime.visitors,
					},
				]);
				currentFile = undefined;
			}
		}

		await ruleRuntime.teardown?.();
	}

	return {
		languageReports: collectLanguageReports
			? [...filesByPath.values()].flatMap(
					(file) => rule.language.getLanguageReports?.(file, linterHost) ?? [],
				)
			: [],
		reports: reports.toSorted(
			(a, b) =>
				fileNames.indexOf(a.fileName) - fileNames.indexOf(b.fileName) ||
				a.range.begin.raw - b.range.begin.raw ||
				a.range.end.raw - b.range.end.raw,
		),
	};
}
