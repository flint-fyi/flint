import fs from "node:fs";
import path from "node:path";

import type { Program } from "typescript-native/unstable/sync";

import type { AST } from "@flint.fyi/typescript-language";

import { isDeclaredInModuleBlock } from "./isDeclaredInModuleBlock.ts";

const packageNamesByDirectory = new Map<string, string | undefined>();

function getPackageNameFromDirectory(directory: string): string {
	const packageName = path.basename(directory);
	const scopeName = path.basename(path.dirname(directory));
	return scopeName.startsWith("@")
		? `${scopeName}/${packageName}`
		: packageName;
}

function getPackageNameFromPackageJson(directory: string): string | undefined {
	if (packageNamesByDirectory.has(directory)) {
		return packageNamesByDirectory.get(directory);
	}

	let packageName: string | undefined;
	try {
		const packageJson: unknown = JSON.parse(
			fs.readFileSync(path.join(directory, "package.json"), "utf8"),
		);
		if (
			typeof packageJson === "object" &&
			packageJson !== null &&
			"name" in packageJson &&
			typeof packageJson.name === "string"
		) {
			packageName = packageJson.name;
		}
	} catch {
		// A missing or malformed package.json falls back to directory-based names.
	}

	packageNamesByDirectory.set(directory, packageName);
	return packageName;
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

	const packageJsonDirectory = program.getSourceFileMetadata(
		sourceFile.fileName,
	)?.packageJsonDirectory;
	if (packageJsonDirectory === undefined) {
		return false;
	}

	// Symlinked packages (pnpm workspaces, `npm link`) resolve to paths outside
	// node_modules, so also compare against the resolved package.json's name
	// rather than only names inferred from the directory path.
	const packageNames = [
		getPackageNameFromDirectory(packageJsonDirectory),
		getPackageNameFromPackageJson(packageJsonDirectory),
	];
	return (
		packageNames.includes(packageName) ||
		packageNames.includes(`@types/${typesPackageName}`)
	);
}
