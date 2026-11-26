import { join } from "pathe";

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
	const { program, sourceFile } = file.services;
	const { configFile, configFilePath } = program.getCompilerOptions();
	const packageJsonScope = program.getSourceFile(
		sourceFile.fileName,
	)?.packageJsonScope;
	const referenced = collectReferencedFilePaths(
		program,
		sourceFile,
		createTypeScriptServerHost(host),
	);

	const dependencies = new Set(
		[
			configFilePath,
			...(configFile?.extendedSourceFiles ?? []),
			packageJsonScope &&
				join(packageJsonScope.packageDirectory, "package.json"),
			...referenced.dependencies,
		].filter((filePath) => filePath !== undefined),
	);
	dependencies.delete(sourceFile.fileName);

	return {
		dependencies: Array.from(dependencies),
		isGlobalDependency: containsGlobalDeclarations(sourceFile),
		missingDependencies: Array.from(
			referenced.missingDependencies.difference(dependencies),
		),
	};
}
