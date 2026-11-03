import { join, relative } from "pathe";

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

	return {
		dependencies: [
			...[
				configFilePath,
				...(configFile?.extendedSourceFiles ?? []),
				packageJsonScope &&
					join(packageJsonScope.packageDirectory, "package.json"),
			]
				.filter((filePath) => filePath !== undefined)
				.map((filePath) => relative(host.getCurrentDirectory(), filePath)),
			...collectReferencedFilePaths(
				program,
				sourceFile,
				createTypeScriptServerHost(host),
			),
		],
		isGlobalDependency: containsGlobalDeclarations(sourceFile),
	};
}
