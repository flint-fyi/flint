import { resolve } from "pathe";
import ts from "typescript";

import { pathKey } from "@flint.fyi/utils";

export function isFromFile(
	sourceFile: ts.SourceFile,
	specifiedPath: string | undefined,
	program: ts.Program,
): boolean {
	if (specifiedPath === undefined) {
		return (
			!sourceFile.fileName.includes("/node_modules/") &&
			!program.isSourceFileDefaultLibrary(sourceFile)
		);
	}

	const caseSensitive = ts.sys.useCaseSensitiveFileNames;
	return (
		pathKey(sourceFile.fileName, caseSensitive) ===
		pathKey(
			resolve(program.getCurrentDirectory(), specifiedPath),
			caseSensitive,
		)
	);
}
