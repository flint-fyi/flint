import type {
	LanguageDiagnostics,
	SourceFileWithLineMap,
} from "@flint.fyi/core";
import { setTSExtraSupportedExtensions } from "@flint.fyi/ts-patch";
import { createVolarBasedLanguage } from "@flint.fyi/volar-language";
import { type AST, parse } from "svelte/compiler";

import { extractDirectives } from "./extractDirectives.ts";
import {
	errorToLanguageDiagnostic,
	virtualCodeDiagnostics,
	volarLanguagePlugin,
} from "./volarLanguagePlugin.ts";

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
				const diagnostics: LanguageDiagnostics = [];
				try {
					ast = parse(sourceText, {
						modern: true,
					});
				} catch (error) {
					diagnostics.push(
						errorToLanguageDiagnostic(sourceFile.fileName, error),
					);
					ast = {
						comments: [],
						css: null,
						end: 0,
						fragment: {
							nodes: [],
							type: "Fragment",
						},
						instance: null,
						module: null,
						options: null,
						start: 0,
						type: "Root",
					};
				}
				const codegenDiagnostic = virtualCodeDiagnostics.get(virtualCode);
				if (codegenDiagnostic != null) {
					diagnostics.push(codegenDiagnostic);
				}
				return {
					directives: extractDirectives(ast, source),
					extraContext: {
						svelte: {
							ast,
							sourceText,
						},
					},
					firstStatementPosition: Math.min(
						...[
							ast.fragment.nodes.find(
								(node) => node.type !== "Text" || !!node.data.trim().length,
							)?.start,
							ast.module?.start,
							ast.instance?.start,
							ast.css?.start,
							ast.options?.start,
							sourceText.length,
						].filter((pos) => typeof pos === "number"),
					),
					getDiagnostics() {
						return diagnostics;
					},
				};
			},
			languagePlugins: [volarLanguagePlugin(ts, options)],
		};
	},
);
