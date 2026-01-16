import type { CharacterReportRange } from "@flint.fyi/core";
import type * as ts from "typescript";

import type * as AST from "./types/ast.ts";

export function getTSNodeRange(
	node: ts.Node,
	sourceFile: AST.SourceFile,
): CharacterReportRange {
	return {
		begin: node.getStart(sourceFile),
		end: node.getEnd(),
	};
}
