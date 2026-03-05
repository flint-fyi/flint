import { normalizePath } from "@flint.fyi/core";
import path from "node:path";
import ts from "typescript";

export function isFromFile(
	sourceFile: ts.SourceFile,
	specifiedPath: string | undefined,
	program: ts.Program,
) {
	if (specifiedPath === undefined) {
		return (
			!sourceFile.fileName.includes("/node_modules/") &&
			!program.isSourceFileDefaultLibrary(sourceFile)
		);
	}

	const caseSensitive = ts.sys.useCaseSensitiveFileNames;
	return (
		normalizePath(sourceFile.fileName, caseSensitive) ===
		normalizePath(
			path.resolve(program.getCurrentDirectory(), specifiedPath),
			caseSensitive,
		)
	);
}
