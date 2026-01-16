import type { CharacterReportRange } from "@flint.fyi/core";
import type * as ts from "typescript";

export function getTSNodeRange(
	node: ts.Node,
	sourceFile: ts.SourceFile,
): CharacterReportRange {
	return {
		begin: node.getStart(sourceFile),
		end: node.getEnd(),
	};
}
