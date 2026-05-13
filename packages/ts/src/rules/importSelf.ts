import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as path from "node:path";
import ts from "typescript";

function canonicalize(filePath: string) {
	const resolvedPath = path.resolve(filePath);
	return ts.sys.useCaseSensitiveFileNames
		? resolvedPath
		: resolvedPath.toLowerCase();
}

function isSelfImport(
	importPath: string,
	currentFilePath: string,
	program: ts.Program,
	service: ts.server.ProjectService,
) {
	const resolved = ts.resolveModuleName(
		importPath,
		currentFilePath,
		program.getCompilerOptions(),
		service.host,
	);

	const resolvedFileName = resolved.resolvedModule?.resolvedFileName;
	if (!resolvedFileName) {
		return false;
	}

	return canonicalize(resolvedFileName) === canonicalize(currentFilePath);
}

export default typescriptLanguage.createRule({
	about: {
		description: "Reports when a module imports itself.",
		id: "importSelf",
		presets: ["logical"],
	},
	messages: {
		noSelfImport: {
			primary: "This module imports itself.",
			secondary: [
				"A file (module) importing itself creates a circular dependency that serves no purpose.",
				"Types and values from the same file can be used direction without an export/import.",
			],
			suggestions: [
				"Remove the self-import.",
				"Refactor the code to avoid circular dependencies.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ImportDeclaration: (node, { program, service, sourceFile }) => {
					if (!ts.isStringLiteral(node.moduleSpecifier)) {
						return;
					}

					const importPath = node.moduleSpecifier.text;

					if (isSelfImport(importPath, sourceFile.fileName, program, service)) {
						context.report({
							message: "noSelfImport",
							range: getTSNodeRange(node.moduleSpecifier, sourceFile),
							suggestions: [
								{
									id: "removeSelfImport",
									range: getTSNodeRange(node, sourceFile),
									text: "",
								},
							],
						});
					}
				},
			},
		};
	},
});
