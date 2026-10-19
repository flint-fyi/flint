import {
	createVFSLinterHost,
	formatReport,
	runConfig,
	type ConfigUseDefinition,
} from "@flint.fyi/core";
import { json } from "@flint.fyi/json";
import { jsx } from "@flint.fyi/jsx";
import { ts } from "@flint.fyi/ts";

import { getPlaygroundLanguage } from "./getPlaygroundLanguage.ts";
import { loadTypeScriptFiles } from "./loadTypeScriptFiles.ts";
import {
	parsePlaygroundFile,
	type PlaygroundParsedFile,
} from "./parsePlaygroundFile.ts";
import type {
	PlaygroundFile,
	PlaygroundFileResult,
	PlaygroundLanguage,
	PlaygroundReport,
} from "./types.ts";

const jsxFilePattern = /\.[jt]sx$/;
const playgroundDirectory = "/playground";

const languageRules: Record<PlaygroundLanguage, ConfigUseDefinition["rules"]> =
	{
		json: json.presets.logical,
		typescript: [ts.presets.logical, ts.presets.stylistic],
	};

/**
 * Lints files together in a virtual file system, so they can import each other.
 */
export async function lintPlaygroundFiles(
	files: readonly PlaygroundFile[],
): Promise<Record<string, PlaygroundFileResult>> {
	const host = createVFSLinterHost({
		caseSensitive: true,
		cwd: playgroundDirectory,
	});
	const fileNamesByLanguage = new Map<PlaygroundLanguage, string[]>();
	const parsedFiles = new Map<string, PlaygroundParsedFile>();

	for (const file of files) {
		const language = getPlaygroundLanguage(file.name);
		if (!language) {
			continue;
		}

		const filePath = `${playgroundDirectory}/${file.name}`;
		const parsedFile = parsePlaygroundFile(file.code, filePath, language);

		host.vfsUpsertFile(filePath, file.code);
		parsedFiles.set(file.name, parsedFile);

		if ("ast" in parsedFile) {
			fileNamesByLanguage.set(language, [
				...(fileNamesByLanguage.get(language) ?? []),
				file.name,
			]);
		}
	}

	if (fileNamesByLanguage.has("typescript")) {
		for (const [filePath, text] of await loadTypeScriptFiles(
			playgroundDirectory,
		)) {
			host.vfsUpsertFile(filePath, text);
		}
	}

	const results = fileNamesByLanguage.size
		? await runConfig(
				{
					filePath: `${playgroundDirectory}/flint.config.ts`,
					use: [
						...[...fileNamesByLanguage].map(([language, fileNames]) => ({
							files: fileNames,
							rules: languageRules[language],
						})),
						{
							files: (fileNamesByLanguage.get("typescript") ?? []).filter(
								(fileName) => jsxFilePattern.test(fileName),
							),
							rules: [jsx.presets.logical, jsx.presets.stylistic],
						},
					].filter((definition) => definition.files.length),
				},
				host,
				{ ignoreCache: true, skipCacheWrite: true },
			)
		: undefined;

	return Object.fromEntries(
		[...parsedFiles].map(
			([fileName, parsedFile]): [string, PlaygroundFileResult] => {
				if ("syntaxReport" in parsedFile) {
					return [fileName, { reports: [parsedFile.syntaxReport] }];
				}

				const fileResults = results?.allFileResults.get(
					`${playgroundDirectory}/${fileName}`,
				);
				const reports = [
					...(fileResults?.reports ?? []).map(
						(report): PlaygroundReport => ({
							begin: report.range.begin.raw,
							column: report.range.begin.column,
							end: report.range.end.raw,
							id: report.about.id,
							line: report.range.begin.line,
							message: formatReport(report.data, report.message.primary),
							source: "flint",
							...(report.about.url && { url: report.about.url }),
						}),
					),
					...(parsedFile.convertLanguageReport
						? (fileResults?.languageReports ?? []).map(
								parsedFile.convertLanguageReport,
							)
						: []),
				];

				return [
					fileName,
					{
						ast: parsedFile.ast,
						reports: reports.toSorted(
							(a, b) => a.begin - b.begin || a.id.localeCompare(b.id),
						),
					},
				];
			},
		),
	);
}
