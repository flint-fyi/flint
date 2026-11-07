import ts from "typescript";

import type {
	LanguageFile,
	LanguageFileCacheImpacts,
	LinterHost,
} from "@flint.fyi/core";

import { collectReferencedFilePaths } from "./collectReferencedFilePaths.ts";
import { createTypeScriptServerHost } from "./createTypeScriptServerHost.ts";
import type { TypeScriptFileServices } from "./types/services.ts";
import { containsGlobalDeclarations } from "./utils/containsGlobalDeclarations.ts";

export function getTypeScriptFileCacheImpacts(
	file: LanguageFile<TypeScriptFileServices>,
	host: LinterHost,
): LanguageFileCacheImpacts {
	const structuralDependencies = new Set<string>();
	const serverHost = createTypeScriptServerHost(host);
	const resolutionHost = {
		...serverHost,
		readFile(filePath: string): string | undefined {
			const content = serverHost.readFile(filePath);
			structuralDependencies.add(filePath);
			return content;
		},
	};
	const program = file.services.program;
	const options = program.getCompilerOptions();
	for (const configFilePath of file.services.projectConfigFilePaths ??
		(typeof options.configFilePath === "string"
			? [options.configFilePath]
			: [])) {
		ts.getParsedCommandLineOfConfigFile(
			configFilePath,
			{},
			{
				...resolutionHost,
				onUnRecoverableConfigFileDiagnostic() {
					// Diagnostics are collected from the program.
				},
			},
		);
	}
	for (const sourceFile of program.getSourceFiles()) {
		ts.getImpliedNodeFormatForFile(
			sourceFile.fileName,
			undefined,
			{
				...resolutionHost,
				fileExists(filePath) {
					structuralDependencies.add(filePath);
					return serverHost.fileExists(filePath);
				},
			},
			options,
		);
	}
	const dependencies = collectReferencedFilePaths(
		program,
		file.services.sourceFile,
		resolutionHost,
	);
	for (const sourceFile of program.getSourceFiles()) {
		if (
			!program.isSourceFileDefaultLibrary(sourceFile) &&
			containsGlobalDeclarations(sourceFile as typeof file.services.sourceFile)
		) {
			dependencies.push(sourceFile.fileName);
		}
	}
	return {
		dependencies,
		isGlobalDependency: containsGlobalDeclarations(file.services.sourceFile),
		structuralDependencies: Array.from(structuralDependencies),
	};
}
