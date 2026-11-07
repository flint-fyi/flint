import { createSourceFile, ScriptTarget } from "typescript";

import { getLanguageReportMessage } from "./getLanguageReportMessage.ts";
import type { PlaygroundParsedFile } from "./parsePlaygroundFile.ts";
import { serializeTypeScriptAst } from "./serializeTypeScriptAst.ts";

export function parseTypeScriptFile(
	code: string,
	filePath: string,
): PlaygroundParsedFile {
	const sourceFile = createSourceFile(
		filePath,
		code,
		ScriptTarget.Latest,
		true,
	);

	return {
		ast: serializeTypeScriptAst(sourceFile, sourceFile),
		convertLanguageReport: (report) => {
			const begin = report.range?.begin ?? 0;
			const { character, line } =
				sourceFile.getLineAndCharacterOfPosition(begin);

			return {
				begin,
				column: character,
				end: report.range?.end ?? begin,
				id: report.code ?? "typescript",
				line,
				message: getLanguageReportMessage(report),
				source: "language",
			};
		},
	};
}
