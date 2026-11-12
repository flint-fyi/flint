import path from "node:path";

import type {
	LanguageFile,
	LanguageFileCacheImpacts,
	LinterHost,
} from "@flint.fyi/core";

import { collectReferencedFilePaths } from "./collectReferencedFilePaths.ts";
import { getTypeScriptContentMapperRegistrations } from "./contentMappers.ts";
import { findNearestConfigFile } from "./findNearestConfigFile.ts";
import type { TypeScriptFileServices } from "./types/services.ts";
import { containsGlobalDeclarations } from "./utils/containsGlobalDeclarations.ts";

export function getTypeScriptFileCacheImpacts(
	file: LanguageFile<TypeScriptFileServices>,
	host: LinterHost,
): LanguageFileCacheImpacts {
	const mapperConfigFilePath = findMapperConfigFile(
		file.about.filePathAbsolute,
		host,
	);

	return {
		dependencies: [
			// TODO: Add support for multi-TSConfig workspaces.
			// https://github.com/flint-fyi/flint/issues/64 & more.
			"tsconfig.json",

			...(mapperConfigFilePath
				? [path.relative(host.getCurrentDirectory(), mapperConfigFilePath)]
				: []),

			...collectReferencedFilePaths(
				file.services.program,
				file.services.typeChecker,
				file.services.sourceFile,
			),
		],
		isGlobalDependency: containsGlobalDeclarations(file.services.sourceFile),
	};
}

// A content mapper may read its own config, such as `svelte.config.js`, which
// changes the file's mapped text without the file itself changing.
function findMapperConfigFile(
	filePathAbsolute: string,
	host: LinterHost,
): string | undefined {
	const configFileNames = getTypeScriptContentMapperRegistrations().find(
		(registration) =>
			registration.extensions.includes(path.extname(filePathAbsolute)),
	)?.configFileNames;

	return (
		configFileNames &&
		findNearestConfigFile(host, filePathAbsolute, new Map(), configFileNames)
	);
}
