import path from "node:path";

import type { Program } from "typescript-native/unstable/sync";

import type { LinterHost } from "@flint.fyi/core";
import type { AST } from "@flint.fyi/typescript-language";
import { parseJsonSafe } from "@flint.fyi/utils";

import { isDeclaredInModuleBlock } from "./isDeclaredInModuleBlock.ts";

// Keyed by host so virtual file systems (the rule tester) never see names read
// for a different run, and so nothing is retained past the host's lifetime.
const packageNamesByHost = new WeakMap<
	LinterHost,
	Map<string, string | undefined>
>();

function getPackageNameFromDirectory(directory: string): string {
	const packageName = path.basename(directory);
	const scopeName = path.basename(path.dirname(directory));
	return scopeName.startsWith("@")
		? `${scopeName}/${packageName}`
		: packageName;
}

function getPackageNameFromPackageJson(
	directory: string,
	host: LinterHost,
): string | undefined {
	let packageNames = packageNamesByHost.get(host);
	if (!packageNames) {
		packageNames = new Map();
		packageNamesByHost.set(host, packageNames);
	}
	if (packageNames.has(directory)) {
		return packageNames.get(directory);
	}

	// A missing or malformed package.json falls back to directory-based names.
	const packageJson: unknown = parseJsonSafe(
		host.readFileSync(path.join(directory, "package.json")),
	);
	const packageName =
		typeof packageJson === "object" &&
		packageJson !== null &&
		"name" in packageJson &&
		typeof packageJson.name === "string"
			? packageJson.name
			: undefined;

	packageNames.set(directory, packageName);
	return packageName;
}

// TODO: Investigate unifying this with / contributing upstream to typescript-eslint.
export function isFromPackage(
	declaration: AST.Declaration,
	packageName: string,
	program: Program,
	host: LinterHost,
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
		getPackageNameFromPackageJson(packageJsonDirectory, host),
	];
	return (
		packageNames.includes(packageName) ||
		packageNames.includes(`@types/${typesPackageName}`)
	);
}
