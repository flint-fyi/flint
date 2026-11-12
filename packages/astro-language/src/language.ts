import { parse } from "@astrojs/compiler/sync";
import type { RootNode } from "@astrojs/compiler/types";

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
import { getAstroPointOffset } from "./getAstroPointOffset.ts";

export interface AstroServices extends TypeScriptFileServices {
	astro: {
		ast: RootNode;
		sourceText: string;
	};
}

export const astroLanguage = typescriptLanguage as unknown as Language<
	TypeScriptNodeVisitors,
	AstroServices
>;

export function createAstroFileContext(sourceText: string): {
	directives: DirectiveCollection["directives"];
	reports: DirectiveCollection["reports"];
	services: Pick<AstroServices, "astro">;
} {
	const { ast } = parse(sourceText, { position: true });
	const source: SourceFileWithLineMap = { text: sourceText };
	const firstPosition = ast.children.at(0)?.position;
	const collector = new DirectivesCollector(
		firstPosition
			? getAstroPointOffset(source, firstPosition.start)
			: sourceText.length,
	);
	for (const directive of extractDirectives(ast, source)) {
		collector.add(directive.range, directive.selection, directive.type);
	}
	return {
		...collector.collect(),
		services: { astro: { ast, sourceText } },
	};
}
