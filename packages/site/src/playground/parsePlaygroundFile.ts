import type { LanguageReport } from "@flint.fyi/core";

import { parseJsonFile } from "./parseJsonFile.ts";
import { parseTypeScriptFile } from "./parseTypeScriptFile.ts";
import type {
	PlaygroundAstNode,
	PlaygroundParser,
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
	parser: PlaygroundParser,
): PlaygroundParsedFile {
	return parser === "json"
		? parseJsonFile(code)
		: parseTypeScriptFile(code, filePath);
}
