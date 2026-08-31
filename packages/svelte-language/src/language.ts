import { parse, type AST } from "svelte/compiler";

import {
	DirectivesCollector,
	type DirectiveCollection,
	type Language,
	type SourceFileWithLineMap,
} from "@flint.fyi/core";
import {
	typescriptLanguage,
	type TypeScriptFileServices,
	type TypeScriptNodeVisitors,
} from "@flint.fyi/typescript-language";

import { extractDirectives } from "./extractDirectives.ts";

export interface SvelteServices extends TypeScriptFileServices {
	svelte: {
		ast: AST.Root;
		sourceText: string;
	};
}

export const svelteLanguage = typescriptLanguage as Language<
	TypeScriptNodeVisitors,
	SvelteServices
>;

export function createSvelteFileContext(sourceText: string): {
	directives: DirectiveCollection["directives"];
	reports: DirectiveCollection["reports"];
	services: Pick<SvelteServices, "svelte">;
} {
	let ast: AST.Root;
	try {
		ast = parse(sourceText, { loose: true, modern: true });
	} catch {
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
		services: { svelte: { ast, sourceText } },
	};
}
