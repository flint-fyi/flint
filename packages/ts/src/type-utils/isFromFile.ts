import path from "node:path";

import type ts from "typescript";

import typescript from "@flint.fyi/typescript-language/typescript";
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

	const caseSensitive = typescript.sys.useCaseSensitiveFileNames;
	return (
		pathKey(sourceFile.fileName, caseSensitive) ===
		pathKey(
			path.resolve(program.getCurrentDirectory(), specifiedPath),
			caseSensitive,
		)
	);
}
