import { setTSExtraSupportedExtensions } from "@flint.fyi/ts-patch";
import { createVolarBasedLanguage } from "@flint.fyi/volar-language";
import { getLanguagePlugin } from "@astrojs/ts-plugin/dist/language.js";
import { parse } from "@astrojs/compiler/sync";
import type { RootNode } from "@astrojs/compiler/types";

setTSExtraSupportedExtensions([".astro"]);

export interface AstroServices {
	astro: {
		ast: RootNode;
	};
}

export const astroLanguage = createVolarBasedLanguage<AstroServices>(
	(ts, options) => {
		return {
			createFile({ sourceScript }) {
				const sourceText = sourceScript.snapshot.getText(
					0,
					sourceScript.snapshot.getLength(),
				);
				// TODO: report parsing errors?
				const { ast } = parse(sourceText, { position: true });
				return {
					// TODO: first statement
					firstStatementPosition: sourceText.length,
					extraContext: {
						astro: {
							ast,
						},
					},
				};
			},
			languagePlugins: [getLanguagePlugin()],
		};
	},
);
