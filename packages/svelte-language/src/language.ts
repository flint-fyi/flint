import { setTSExtraSupportedExtensions } from "@flint.fyi/ts-patch";
import { createVolarBasedLanguage } from "@flint.fyi/volar-language";

import { extractDirectives } from "./extractDirectives.ts";
import { parse, type AST } from "svelte/compiler";
import { volarLanguagePlugin } from "./volarLanguagePlugin.ts";

setTSExtraSupportedExtensions([".svelte"]);

export interface SvelteServices {
	svelte: {
		ast: AST.Root;
		sourceText: string;
	};
}

export const svelteLanguage = createVolarBasedLanguage<SvelteServices>(() => {
	return {
		createFile({ sourceScript }) {
			const sourceText = sourceScript.snapshot.getText(
				0,
				sourceScript.snapshot.getLength(),
			);
			// TODO: report parsing errors?
			const ast = parse(sourceText, {
				modern: true,
			});
			return {
				// TODO: first statement
				firstStatementPosition: sourceText.length,
				extraContext: {
					svelte: {
						ast,
						sourceText,
					},
				},
			};
		},
		languagePlugins: [volarLanguagePlugin],
	};
});
