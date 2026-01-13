import * as path from "node:path";
import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";

function getFileNameWithoutExtension(filePath: string): string {
	const ext = path.extname(filePath);
	return ext ? filePath.slice(0, -ext.length) : filePath;
}

function isSelfImport(
	importPath: string,
	currentFilePath: string,
	program: ts.Program,
): boolean {
	// Skip non-relative imports
	if (!importPath.startsWith(".")) {
		return false;
	}

	const currentDir = path.dirname(currentFilePath);
	const resolvedImportPath = path.resolve(currentDir, importPath);

	// Try TypeScript's module resolution first
	const resolved = ts.resolveModuleName(
		importPath,
		currentFilePath,
		program.getCompilerOptions(),
		ts.sys,
	);

	if (resolved.resolvedModule) {
		const resolvedPath = path.resolve(resolved.resolvedModule.resolvedFileName);
		const normalizedCurrentPath = path.resolve(currentFilePath);
		return resolvedPath === normalizedCurrentPath;
	}

	// Fallback: simple path comparison for test environments
	// Compare without extensions
	const currentWithoutExt = getFileNameWithoutExtension(
		path.resolve(currentFilePath),
	);
	const importWithoutExt = getFileNameWithoutExtension(resolvedImportPath);

	return currentWithoutExt === importWithoutExt;
}

export default typescriptLanguage.createRule({
	about: {
		description: "Reports when a module imports itself.",
		id: "importSelf",
		preset: "logical",
	},
	messages: {
		noSelfImport: {
			primary: "Module imports itself.",
			secondary: [
				"A module importing itself creates a circular dependency that serves no purpose.",
			],
			suggestions: [
				"Remove the self-import, or refactor the code to avoid circular dependencies.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ImportDeclaration: (node, { program, sourceFile }) => {
					const moduleSpecifier = node.moduleSpecifier;
					if (!ts.isStringLiteral(moduleSpecifier)) {
						return;
					}

					const importPath = moduleSpecifier.text;
					const currentFilePath = sourceFile.fileName;

					if (isSelfImport(importPath, currentFilePath, program)) {
						context.report({
							message: "noSelfImport",
							range: getTSNodeRange(moduleSpecifier, sourceFile),
						});
					}
				},
			},
		};
	},
});
