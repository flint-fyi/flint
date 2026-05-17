import { parse } from "@astrojs/compiler/sync";
import type { DiagnosticMessage, RootNode } from "@astrojs/compiler/types";
import { getLanguagePlugin } from "@astrojs/ts-plugin/dist/language.js";
import {
	getPositionOfColumnAndLine,
	type LanguageReport,
	type SourceFileWithLineMap,
} from "@flint.fyi/core";
import { setTSExtraSupportedExtensions } from "@flint.fyi/ts-patch";
import { createVolarBasedLanguage } from "@flint.fyi/volar-language";

import { extractDirectives } from "./extractDirectives.ts";

setTSExtraSupportedExtensions([".astro"]);

export interface AstroServices {
	astro: {
		ast: RootNode;
	};
}

export function astroCompilerDiagnosticToLanguageReport(
	fileName: string,
	source: SourceFileWithLineMap,
	diagnostic: DiagnosticMessage,
): LanguageReport {
	// location.line and location.column are both 1-indexed
	const begin = getPositionOfColumnAndLine(source, {
		column: diagnostic.location.column - 1,
		line: diagnostic.location.line - 1,
	});
	return {
		code: `ASTRO${diagnostic.code}`,
		range: { begin, end: begin + diagnostic.location.length },
		text: `${fileName}:${diagnostic.location.line}:${diagnostic.location.column} - ${diagnostic.text}${diagnostic.hint ? ` (${diagnostic.hint})` : ""}`,
	};
}

export const astroLanguage = createVolarBasedLanguage<AstroServices>(() => {
	return {
		createFile({ sourceFile, sourceScript }) {
			const sourceText = sourceScript.snapshot.getText(
				0,
				sourceScript.snapshot.getLength(),
			);
			const { ast, diagnostics } = parse(sourceText, { position: true });
			const source: SourceFileWithLineMap = { text: sourceText };
			return {
				directives: extractDirectives(ast),
				extraContext: {
					astro: {
						ast,
					},
				},
				firstStatementPosition:
					ast.children[0]?.position?.start.offset ?? sourceText.length,
				getLanguageReports() {
					return diagnostics.map((diagnostic) =>
						astroCompilerDiagnosticToLanguageReport(
							sourceFile.fileName,
							source,
							diagnostic,
						),
					);
				},
			};
		},
		languagePlugins: [getLanguagePlugin()],
	};
});
