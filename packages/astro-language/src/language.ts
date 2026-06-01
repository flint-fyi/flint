import { parse } from "@astrojs/compiler/sync";
import type { RootNode } from "@astrojs/compiler/types";
import { getLanguagePlugin } from "@astrojs/ts-plugin/dist/language.js";
import type { SourceFileWithLineMap } from "@flint.fyi/core";
import { setTSExtraSupportedExtensions } from "@flint.fyi/ts-patch";
import { createVolarBasedLanguage } from "@flint.fyi/volar-language";

import { astroCompilerDiagnosticToLanguageReport } from "./astroCompilerDiagnosticToLanguageReport.ts";
import { extractDirectives } from "./extractDirectives.ts";

setTSExtraSupportedExtensions([".astro"]);

export interface AstroServices {
	astro: {
		ast: RootNode;
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
