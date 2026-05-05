import type { LanguageReports, SourceFileWithLineMap } from "@flint.fyi/core";
import { setTSExtraSupportedExtensions } from "@flint.fyi/ts-patch";
import { createVolarBasedLanguage } from "@flint.fyi/volar-language";
import { type AST, parse } from "svelte/compiler";

import { extractDirectives } from "./extractDirectives.ts";
import {
	errorToLanguageReport,
	virtualCodeReports,
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
				const reports: LanguageReports = [];
				try {
					ast = parse(sourceText, {
						loose: true,
						modern: true,
					});
				} catch (error) {
					reports.push(errorToLanguageReport(sourceFile.fileName, error));
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
				const codegenReport = virtualCodeReports.get(virtualCode);
				if (codegenReport != null) {
					reports.push(codegenReport);
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
					getLanguageReports() {
						return reports;
					},
				};
			},
			languagePlugins: [volarLanguagePlugin(ts, options)],
		};
	},
);
