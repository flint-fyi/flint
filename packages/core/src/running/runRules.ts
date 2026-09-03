import { CachedFactory } from "cached-factory";

import type { LinterHost } from "../types/host.ts";
import type { FileReport } from "../types/reports.ts";
import type { AnyRule } from "../types/rules.ts";
import { runLintRule } from "./runLintRule.ts";
import type { LanguageFilesWithOptions } from "./types.ts";

export async function runRules(
	rulesFilesAndOptionsByRule: Map<AnyRule, LanguageFilesWithOptions[]>,
	host: LinterHost,
): Promise<CachedFactory<string, FileReport[]>> {
	const reportsByFilePath = new CachedFactory<string, FileReport[]>(() => []);

	await Promise.all(
		Array.from(rulesFilesAndOptionsByRule).map(
			async ([rule, filesAndOptions]) => {
				const ruleReportsByFilePath = await runLintRule(
					rule,
					filesAndOptions,
					host,
				);

				for (const [filePath, ruleReports] of ruleReportsByFilePath) {
					reportsByFilePath.get(filePath).push(...ruleReports);
				}
			},
		),
	);

	return reportsByFilePath;
}
