import type { Declaration, Program } from "typescript";

export function declarationIncludesGlobal(
	declaration: Declaration,
	program: Program,
) {
	const sourceFile = declaration.getSourceFile();
	return (
		program.isSourceFileDefaultLibrary(sourceFile) ||
		/\/lib\.[^/]*\.d\.ts$/.test(sourceFile.fileName)
	);
}
