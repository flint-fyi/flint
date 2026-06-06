import ts from "typescript";

import { isDeclaredInModuleBlock } from "./isDeclaredInModuleBlock.ts";

// TODO: Investigate unifying this with / contributing upstream to typescript-eslint.
export function isFromPackage(
	declaration: ts.Declaration,
	packageName: string,
	program: ts.Program,
) {
	if (isDeclaredInModuleBlock(declaration, packageName)) {
		return true;
	}

	const sourceFile = declaration.getSourceFile();

	if (!program.isSourceFileFromExternalLibrary(sourceFile)) {
		return false;
	}

	const resolvedName = program.sourceFileToPackageName.get(sourceFile.path);

	if (
		resolvedName === packageName ||
		sourceFile.fileName.includes(`/node_modules/${packageName}/`)
	) {
		return true;
	}

	const typesPackageName = packageName.replace(/^@([^/]+)\//, "$1__");

	return (
		resolvedName === typesPackageName ||
		sourceFile.fileName.includes(`/node_modules/@types/${typesPackageName}/`)
	);
}
