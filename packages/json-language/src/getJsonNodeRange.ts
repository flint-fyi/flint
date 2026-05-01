import type { CharacterReportRange } from "@flint.fyi/core";

import type { JsonNode, JsonSourceFile } from "./nodes.ts";

export function getJsonNodeRange(
	node: JsonNode,
	sourceFile: JsonSourceFile,
): CharacterReportRange {
	return {
		begin: node.getStart(sourceFile),
		end: node.getEnd(),
	};
}
