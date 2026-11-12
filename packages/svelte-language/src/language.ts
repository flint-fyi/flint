import { parse, type AST } from "svelte/compiler";

import {
	DirectivesCollector,
	type DirectiveCollection,
	type Language,
	type LanguageReports,
	type SourceFileWithLineMap,
} from "@flint.fyi/core";
import {
	typescriptLanguage,
	type TypeScriptFileServices,
	type TypeScriptNodeVisitors,
} from "@flint.fyi/typescript-language";

import { errorToLanguageReport } from "./errorToLanguageReport.ts";
import { extractDirectives } from "./extractDirectives.ts";

export interface SvelteServices extends TypeScriptFileServices {
	svelte: {
		ast: AST.Root;
		sourceText: string;
	};
}

export const svelteLanguage = typescriptLanguage as unknown as Language<
	TypeScriptNodeVisitors,
	SvelteServices
>;

export function createSvelteFileContext(
	fileName: string,
	sourceText: string,
): {
	directives: DirectiveCollection["directives"];
	languageReports: LanguageReports;
	reports: DirectiveCollection["reports"];
	services: Pick<SvelteServices, "svelte">;
} {
	let ast: AST.Root;
	const languageReports: LanguageReports = [];
	try {
		ast = parse(sourceText, { loose: true, modern: true });
	} catch (error) {
		// Without a report, a file whose template never parsed would lint clean
		// against the empty AST below.
		languageReports.push(errorToLanguageReport(fileName, error));
		ast = {
			comments: [],
			css: null,
			end: 0,
			fragment: { nodes: [], type: "Fragment" },
			instance: null,
			module: null,
			options: null,
			start: 0,
			type: "Root",
		};
	}
	const source: SourceFileWithLineMap = { text: sourceText };
	const firstStatementPosition = Math.min(
		...[
			ast.fragment.nodes.find(
				(node) => node.type !== "Text" || !!node.data.trim().length,
			)?.start,
			ast.module?.start,
			ast.instance?.start,
			ast.css?.start,
			ast.options?.start,
			sourceText.length,
		].filter((position) => typeof position === "number"),
	);
	const collector = new DirectivesCollector(firstStatementPosition);
	for (const directive of extractDirectives(ast, source)) {
		collector.add(directive.range, directive.selection, directive.type);
	}
	return {
		...collector.collect(),
		languageReports,
		services: { svelte: { ast, sourceText } },
	};
}
