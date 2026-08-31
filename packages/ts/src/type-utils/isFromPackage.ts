import path from "node:path";

import type { Program } from "typescript-native/unstable/sync";

import type { AST } from "@flint.fyi/typescript-language";

import { isDeclaredInModuleBlock } from "./isDeclaredInModuleBlock.ts";

function getPackageNameFromDirectory(directory: string): string {
	const packageName = path.basename(directory);
	const scopeName = path.basename(path.dirname(directory));
	return scopeName.startsWith("@")
		? `${scopeName}/${packageName}`
		: packageName;
}

// TODO: Investigate unifying this with / contributing upstream to typescript-eslint.
export function isFromPackage(
	declaration: AST.Declaration,
	packageName: string,
	program: Program,
): boolean {
	if (isDeclaredInModuleBlock(declaration, packageName)) {
		return true;
	}

	const sourceFile = declaration.getSourceFile();

	if (!program.isSourceFileFromExternalLibrary(sourceFile)) {
		return false;
	}

	if (sourceFile.fileName.includes(`/node_modules/${packageName}/`)) {
		return true;
	}

	const typesPackageName = packageName.replace(/^@([^/]+)\//, "$1__");

	if (
		sourceFile.fileName.includes(`/node_modules/@types/${typesPackageName}/`)
	) {
		return true;
	}

	const packageJsonDirectory =
		program.getSourceFileMetadata(sourceFile)?.packageJsonDirectory;
	return (
		packageJsonDirectory !== undefined &&
		(getPackageNameFromDirectory(packageJsonDirectory) === packageName ||
			getPackageNameFromDirectory(packageJsonDirectory) ===
				`@types/${typesPackageName}`)
	);
}
