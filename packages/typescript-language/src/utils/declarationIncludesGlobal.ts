import type { Program } from "typescript-native/unstable/sync";

import type * as AST from "../types/ast.ts";

export function declarationIncludesGlobal(
	declaration: AST.Declaration,
	program: Program,
): boolean {
	const sourceFile = declaration.getSourceFile();
	return (
		program.isSourceFileDefaultLibrary(sourceFile) ||
		/\/lib\.[^/]*\.d\.ts$/.test(sourceFile.fileName)
	);
}
