import type { CharacterReportRange } from "@flint.fyi/core";

import type * as AST from "./types/ast.ts";

export function getTSNodeRange(
	node: AST.AnyNode,
	sourceFile: AST.SourceFile,
): CharacterReportRange {
	return {
		begin: node.getStart(sourceFile),
		end: node.end,
	};
}
