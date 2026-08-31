import { parse } from "@astrojs/compiler/sync";
import type { RootNode } from "@astrojs/compiler/types";

import {
	DirectivesCollector,
	type DirectiveCollection,
	type Language,
} from "@flint.fyi/core";
import {
	typescriptLanguage,
	type TypeScriptFileServices,
	type TypeScriptNodeVisitors,
} from "@flint.fyi/typescript-language";

import { extractDirectives } from "./extractDirectives.ts";

export interface AstroServices extends TypeScriptFileServices {
	astro: {
		ast: RootNode;
	};
}

export const astroLanguage = typescriptLanguage as Language<
	TypeScriptNodeVisitors,
	AstroServices
>;

export function createAstroFileContext(sourceText: string): {
	directives: DirectiveCollection["directives"];
	reports: DirectiveCollection["reports"];
	services: Pick<AstroServices, "astro">;
} {
	const { ast } = parse(sourceText, { position: true });
	const collector = new DirectivesCollector(
		ast.children[0]?.position?.start.offset ?? sourceText.length,
	);
	for (const directive of extractDirectives(ast)) {
		collector.add(directive.range, directive.selection, directive.type);
	}
	return {
		...collector.collect(),
		services: { astro: { ast } },
	};
}
