import type { Declaration, Program } from "typescript";

export function declarationIncludesGlobal(
	declaration: Declaration,
	program: Program,
): boolean {
	const sourceFile = declaration.getSourceFile();
	return (
		program.isSourceFileDefaultLibrary(sourceFile) ||
		/\/lib\.[^/]*\.d\.ts$/.test(sourceFile.fileName)
	);
}
