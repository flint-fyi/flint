import {
	getColumnAndLineOfPosition,
	type CharacterReportRange,
	type NormalizedReportRangeObject,
} from "@flint.fyi/core";

import type * as AST from "./types/ast.ts";

export function normalizeRange(
	original: AST.AnyNode | CharacterReportRange,
	sourceFile: AST.SourceFile,
): NormalizedReportRangeObject {
	const onCharacters = isNode(original)
		? { begin: original.getStart(sourceFile), end: original.end }
		: original;

	return {
		begin: getColumnAndLineOfPosition(sourceFile, onCharacters.begin),
		end: getColumnAndLineOfPosition(sourceFile, onCharacters.end),
	};
}

function isNode(value: unknown): value is AST.AnyNode {
	return (
		typeof value === "object" &&
		value !== null &&
		"pos" in value &&
		"kind" in value
	);
}
