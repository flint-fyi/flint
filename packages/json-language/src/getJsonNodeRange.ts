import type { CharacterReportRange } from "@flint.fyi/core";
import type { AST } from "@flint.fyi/typescript-language";

import type { JsonNode } from "./nodes.ts";

export function getJsonNodeRange(
	node: JsonNode,
	sourceFile: AST.SourceFile,
): CharacterReportRange {
	return {
		begin: node.getStart(sourceFile),
		end: node.getEnd(),
	};
}
