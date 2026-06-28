import type ts from "typescript";

export function declarationIncludesGlobal(declaration: ts.Declaration) {
	const sourceFile = declaration.getSourceFile();
	return (
		// flint-disable-lines-begin ts/deprecated -- https://github.com/flint-fyi/flint/issues/3057
		// eslint-disable-next-line @typescript-eslint/no-deprecated -- https://github.com/flint-fyi/flint/issues/3057
		sourceFile.hasNoDefaultLib ||
		/\/lib\.[^/]*\.d\.ts$/.test(sourceFile.fileName)
	);
}
