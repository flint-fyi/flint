import type ts from "typescript";

export function declarationIncludesGlobal(declaration: ts.Declaration) {
	const sourceFile = declaration.getSourceFile();
	return (
		// eslint-disable-next-line @typescript-eslint/no-deprecated
		sourceFile.hasNoDefaultLib ||
		/\/lib\.[^/]*\.d\.ts$/.test(sourceFile.fileName)
	);
}
