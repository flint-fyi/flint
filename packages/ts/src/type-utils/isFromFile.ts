import path from "node:path";

import type { SourceFile } from "typescript-native/unstable/ast";
import type { Program } from "typescript-native/unstable/sync";

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
