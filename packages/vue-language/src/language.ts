import {
	NodeTypes,
	parse as vueParse,
	type CompilerError,
	type RootNode,
} from "@vue/compiler-dom";

import {
	DirectivesCollector,
	type DirectiveCollection,
	type Language,
	type LanguageReports,
} from "@flint.fyi/core";
import {
	typescriptLanguage,
	type TypeScriptFileServices,
	type TypeScriptNodeVisitors,
} from "@flint.fyi/typescript-language";

import { extractTemplateDirectives } from "./extractTemplateDirectives.ts";
import { vueParsingErrorsToLanguageReports } from "./vueParsingErrorsToLanguageReports.ts";

export interface VueServices extends TypeScriptFileServices {
	vue: {
		sfc: RootNode;
	};
}

export const vueLanguage = typescriptLanguage as Language<
	TypeScriptNodeVisitors,
	VueServices
>;

export function createVueFileContext(
	fileName: string,
	sourceText: string,
): {
	directives: DirectiveCollection["directives"];
	languageReports: LanguageReports;
	reports: DirectiveCollection["reports"];
	services: Pick<VueServices, "vue">;
} {
	const errors: CompilerError[] = [];
	const sfc = vueParse(sourceText, {
		comments: true,
		expressionPlugins: ["typescript"],
		onError: (error) => errors.push(error),
		parseMode: "html",
	});
	const collector = new DirectivesCollector(
		sfc.children.find((child) => child.type !== NodeTypes.COMMENT)?.loc.start
			.offset ?? sourceText.length,
	);
	for (const directive of extractTemplateDirectives(sfc)) {
		collector.add(directive.range, directive.selection, directive.type);
	}
	const collection = collector.collect();
	return {
		...collection,
		languageReports: vueParsingErrorsToLanguageReports(fileName, errors),
		services: { vue: { sfc } },
	};
}
