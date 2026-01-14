import type ts from "typescript";

export function declarationIncludesGlobal(declaration: ts.Declaration) {
	const sourceFile = declaration.getSourceFile();
	return (
		sourceFile.hasNoDefaultLib ||
		/\/lib\.[^/]*\.d\.ts$/.test(sourceFile.fileName)
	);
}
