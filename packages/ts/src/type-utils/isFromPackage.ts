import ts from "typescript";

import { isDeclaredInModuleBlock } from "./isDeclaredInModuleBlock.ts";

// TODO: Investigate unifying the two / contributing upstream.
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

	const typesPackageName = packageName.replace(/^@([^/]+)\//, "$1__");

	// Use the program's sourceFileToPackageName mapping when available,
	// following the same approach as @typescript-eslint/type-utils.
	const pkgName = (
		program as unknown as {
			sourceFileToPackageName?: ReadonlyMap<string, string>;
		}
	).sourceFileToPackageName?.get(
		(sourceFile as unknown as { path: string }).path,
	);

	if (pkgName != null) {
		return pkgName === packageName || pkgName === typesPackageName;
	}

	return (
		sourceFile.fileName.includes(`/node_modules/${packageName}/`) ||
		sourceFile.fileName.includes(`/node_modules/@types/${typesPackageName}/`)
	);
}
