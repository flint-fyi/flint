import type { CharacterReportRange } from "@flint.fyi/core";
import type * as ts from "typescript";

import type { JsonNode } from "./nodes.ts";

export function getJsonNodeRange(
	node: JsonNode,
	sourceFile: ts.JsonSourceFile,
): CharacterReportRange {
	return {
		begin: node.getStart(sourceFile),
		end: node.getEnd(),
	};
}
