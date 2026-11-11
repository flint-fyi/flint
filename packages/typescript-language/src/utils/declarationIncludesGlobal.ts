import type { Program } from "../native/sync.ts";
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
