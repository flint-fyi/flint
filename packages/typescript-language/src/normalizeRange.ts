import {
	type CharacterReportRange,
	getColumnAndLineOfPosition,
	type NormalizedReportRangeObject,
} from "@flint.fyi/core";
import type * as ts from "typescript";

import type * as AST from "./types/ast.ts";

export function normalizeRange(
	original: CharacterReportRange,
	sourceFile: AST.SourceFile,
): NormalizedReportRangeObject {
	const onCharacters = isNode(original)
		? { begin: original.getStart(sourceFile), end: original.getEnd() }
		: original;

	return {
		begin: getColumnAndLineOfPosition(sourceFile, onCharacters.begin),
		end: getColumnAndLineOfPosition(sourceFile, onCharacters.end),
	};
}

function isNode(value: unknown): value is ts.Node {
	return typeof value === "object" && value !== null && "kind" in value;
}
