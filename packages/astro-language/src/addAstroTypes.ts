import type ts from "typescript";

// Astro's language server injects these same type files through getScriptFileNames:
// https://github.com/withastro/astro/blob/c0f33eda8adf6f8f2588688f6205b76a96a42466/packages/language-tools/language-server/src/core/index.ts#L31-L81
export function addAstroTypes(
	typescript: typeof ts,
	options: ts.CreateProgramOptions,
): void {
	const astroRootNames = options.rootNames.filter((fileName) =>
		fileName.endsWith(".astro"),
	);
	if (!astroRootNames.length) {
		return;
	}

	const host = options.host ?? typescript.sys;
	const cache = options.host?.getModuleResolutionCache?.();
	const astroTypeRootNames: string[] = [];
	for (const moduleName of ["astro/env", "astro/astro-jsx"]) {
		const fileName = resolveModuleFileName(
			typescript,
			options,
			host,
			cache,
			moduleName,
			astroRootNames,
		);
		if (fileName != null && !options.rootNames.includes(fileName)) {
			astroTypeRootNames.push(fileName);
		}
	}

	if (!astroTypeRootNames.length) {
		return;
	}

	options.rootNames = [...options.rootNames, ...astroTypeRootNames];
}

function resolveModuleFileName(
	typescript: typeof ts,
	options: ts.CreateProgramOptions,
	host: ts.ModuleResolutionHost,
	cache: ts.ModuleResolutionCache | undefined,
	moduleName: string,
	containingFileNames: string[],
): string | undefined {
	for (const containingFileName of containingFileNames) {
		const resolved = typescript.resolveModuleName(
			moduleName,
			containingFileName,
			options.options,
			host,
			cache,
		).resolvedModule?.resolvedFileName;
		if (resolved != null) {
			return resolved;
		}
	}
}
