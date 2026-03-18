import { setTSExtraSupportedExtensions } from "@flint.fyi/ts-patch";
import { createVolarBasedLanguage } from "@flint.fyi/volar-language";

import { extractDirectives } from "./extractDirectives.ts";
import { parse, type AST } from "svelte/compiler";
import {
	errorToLanguageDiagnostic,
	virtualCodeDiagnostics,
	volarLanguagePlugin,
} from "./volarLanguagePlugin.ts";
import type {
	LanguageDiagnostics,
	LanguageFileDiagnostic,
	SourceFileWithLineMap,
} from "@flint.fyi/core";

setTSExtraSupportedExtensions([".svelte"]);

export interface SvelteServices {
	svelte: {
		ast: AST.Root;
		sourceText: string;
	};
}

export const svelteLanguage = createVolarBasedLanguage<SvelteServices>(
	(ts, options) => {
		return {
			createFile({ sourceFile, sourceScript }) {
				const sourceText = sourceScript.snapshot.getText(
					0,
					sourceScript.snapshot.getLength(),
				);
				const source: SourceFileWithLineMap = { text: sourceText };
				const virtualCode = sourceScript.generated.root;
				let ast: AST.Root;
				let diagnostics: LanguageDiagnostics = [];
				try {
					ast = parse(sourceText, {
						modern: true,
					});
				} catch (error) {
					diagnostics.push(
						errorToLanguageDiagnostic(sourceFile.fileName, error),
					);
					ast = {
						type: "Root",
						comments: [],
						css: null,
						start: 0,
						end: 0,
						module: null,
						fragment: {
							type: "Fragment",
							nodes: [],
						},
						instance: null,
						options: null,
					};
				}
				const codegenDiagnostic = virtualCodeDiagnostics.get(virtualCode);
				if (codegenDiagnostic != null) {
					diagnostics.push(codegenDiagnostic);
				}
				return {
					firstStatementPosition: Math.min(
						...[
							ast.fragment.nodes.find(
								(node) => node.type !== "Text" || node.data.trim().length > 0,
							)?.start,
							ast.module?.start,
							ast.instance?.start,
							ast.css?.start,
							ast.options?.start,
							sourceText.length,
						].filter((pos) => typeof pos === "number"),
					),
					directives: extractDirectives(ast, source),
					getDiagnostics() {
						return diagnostics;
					},
					extraContext: {
						svelte: {
							ast,
							sourceText,
						},
					},
				};
			},
			languagePlugins: [volarLanguagePlugin(ts, options)],
		};
	},
);
