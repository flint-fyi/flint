import type { LanguageReport } from "@flint.fyi/core";

import { parseJsonFile } from "./parseJsonFile.ts";
import { parseTypeScriptFile } from "./parseTypeScriptFile.ts";
import type {
	PlaygroundAstNode,
	PlaygroundLanguage,
	PlaygroundReport,
} from "./types.ts";

export type PlaygroundParsedFile =
	| {
			ast: PlaygroundAstNode;
			convertLanguageReport?: (report: LanguageReport) => PlaygroundReport;
	  }
	| { syntaxReport: PlaygroundReport };

export function parsePlaygroundFile(
	code: string,
	filePath: string,
	language: PlaygroundLanguage,
): PlaygroundParsedFile {
	return language === "json"
		? parseJsonFile(code)
		: parseTypeScriptFile(code, filePath);
}
