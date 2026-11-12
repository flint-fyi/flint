import path from "node:path";

import type { SourceFile } from "@flint.fyi/typescript-language/native/ast";
import type { Program } from "@flint.fyi/typescript-language/native/sync";

export function isFromFile(
	sourceFile: SourceFile,
	specifiedPath: string | undefined,
	program: Program,
): boolean {
	if (specifiedPath === undefined) {
		return (
			!sourceFile.fileName.includes("/node_modules/") &&
			!program.isSourceFileDefaultLibrary(sourceFile)
		);
	}

	return (
		program.getCanonicalFileName(path.resolve(sourceFile.fileName)) ===
		program.getCanonicalFileName(
			path.resolve(program.getCurrentDirectory(), specifiedPath),
		)
	);
}
