import { basename, dirname, join, resolve } from "pathe";
import ts from "typescript";

import { getTSExtraSupportedExtensions } from "@flint.fyi/ts-patch";

export interface ModuleLookup {
	path: string;

	/**
	 * Directory whose files this lookup decides when it exists, such as a package's directory for its package.json.
	 */
	scope?: string;
}

interface ExtensionKinds {
	declaration: boolean;
	javascript: boolean;
	json: boolean;
	typescript: boolean;
}

const allExtensions: ExtensionKinds = {
	declaration: true,
	javascript: true,
	json: true,
	typescript: true,
};

const declarationExtensions: ExtensionKinds = {
	declaration: true,
	javascript: false,
	json: false,
	typescript: false,
};

// Longest first, so ".d.ts" is stripped before ".ts".
const knownExtensions = [
	".d.mts",
	".d.cts",
	".d.ts",
	".json",
	".mts",
	".cts",
	".tsx",
	".ts",
	".mjs",
	".cjs",
	".jsx",
	".js",
];

/**
 * Paths node module resolution checks for an import, in the order it checks them.
 * Mirrors `nodeModuleNameResolverWorker` and the functions it calls:
 * https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/moduleNameResolver.ts
 * It also lists the lookups ECMAScript module mode skips.
 * It leaves out the `baseUrl` option and `node10` resolution that TypeScript 6 deprecates.
 */
export function getModuleLookups(
	moduleName: string,
	containingFile: string,
	options: ts.CompilerOptions,
	listPackageFiles: (packageDirectory: string) => boolean,
): Generator<ModuleLookup> {
	return withModuleSuffixes(
		getUnsuffixedModuleLookups(
			moduleName,
			containingFile,
			options,
			listPackageFiles,
		),
		options.moduleSuffixes,
	);
}

function* getUnsuffixedModuleLookups(
	moduleName: string,
	containingFile: string,
	options: ts.CompilerOptions,
	listPackageFiles: (packageDirectory: string) => boolean,
): Generator<ModuleLookup> {
	if (ts.isExternalModuleNameRelative(moduleName)) {
		const candidate = resolve(dirname(containingFile), moduleName);
		for (const rootDirCandidate of [
			candidate,
			...getRootDirsCandidates(candidate, options.rootDirs),
		]) {
			yield* getRelativeLookups(rootDirCandidate, allExtensions);
		}
		return;
	}

	yield* getPathsLookups(moduleName, options);

	// TypeScript resolves `#` imports only from the package.json scope, which is already a dependency,
	// and skips node_modules for specifiers that look like URIs, such as `node:fs`:
	// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/moduleNameResolver.ts#L1920-L1940
	if (moduleName.startsWith("#") || moduleName.includes(":")) {
		return;
	}

	// Every ancestor's node_modules is searched for TypeScript and declaration files before any for JavaScript files.
	for (const extensions of [
		{ ...allExtensions, javascript: false, json: false },
		{ ...allExtensions, declaration: false, typescript: false },
	]) {
		yield* getNodeModulesLookups(
			moduleName,
			dirname(containingFile),
			extensions,
			listPackageFiles,
		);
		// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/moduleNameResolver.ts#L1946-L1948
		if (extensions.declaration) {
			for (const typeRoot of options.typeRoots ?? []) {
				yield* getRelativeLookups(
					getCandidateFromTypeRoot(typeRoot, moduleName),
					declarationExtensions,
				);
			}
		}
	}
}

/**
 * Paths type reference resolution checks for a `types` entry, in the order it checks them.
 * Mirrors `resolveTypeReferenceDirective`:
 * https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/moduleNameResolver.ts#L538-L724
 * The containing file TypeScript uses for `types` is in the config's directory.
 */
export function getTypeReferenceLookups(
	typeName: string,
	configDirectory: string,
	options: ts.CompilerOptions,
	listPackageFiles: (packageDirectory: string) => boolean,
): Generator<ModuleLookup> {
	return withModuleSuffixes(
		getUnsuffixedTypeReferenceLookups(
			typeName,
			configDirectory,
			options.typeRoots,
			listPackageFiles,
		),
		options.moduleSuffixes,
	);
}

function* getUnsuffixedTypeReferenceLookups(
	typeName: string,
	configDirectory: string,
	typeRoots: readonly string[] | undefined,
	listPackageFiles: (packageDirectory: string) => boolean,
): Generator<ModuleLookup> {
	for (const typeRoot of typeRoots ?? getDefaultTypeRoots(configDirectory)) {
		const candidate = getCandidateFromTypeRoot(typeRoot, typeName);
		// Custom type roots also resolve the candidate as a file, like modules.
		if (typeRoots) {
			yield* getRelativeLookups(candidate, declarationExtensions);
			continue;
		}
		yield { path: join(candidate, "package.json"), scope: candidate };
		yield* addExtensions(join(candidate, "index"), "", declarationExtensions);
	}

	// TypeScript skips node_modules for `types` entries when the config sets custom type roots.
	if (typeRoots) {
		return;
	}

	if (ts.isExternalModuleNameRelative(typeName)) {
		yield* getRelativeLookups(
			resolve(configDirectory, typeName),
			declarationExtensions,
		);
		return;
	}

	yield* getNodeModulesLookups(
		typeName,
		configDirectory,
		declarationExtensions,
		listPackageFiles,
	);
}

// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/moduleNameResolver.ts#L2131-L2190
function* addExtensions(
	stem: string,
	originalExtension: string,
	extensions: ExtensionKinds,
): Generator<ModuleLookup> {
	const candidates: [boolean, string][] = (() => {
		switch (originalExtension) {
			case "":
			case ".d.ts":
			case ".js":
			case ".ts":
				return [
					[extensions.typescript, ".ts"],
					[extensions.typescript, ".tsx"],
					[extensions.declaration, ".d.ts"],
					[extensions.javascript, ".js"],
					[extensions.javascript, ".jsx"],
				];
			case ".cjs":
			case ".cts":
			case ".d.cts":
				return [
					[extensions.typescript, ".cts"],
					[extensions.declaration, ".d.cts"],
					[extensions.javascript, ".cjs"],
				];
			case ".d.mts":
			case ".mjs":
			case ".mts":
				return [
					[extensions.typescript, ".mts"],
					[extensions.declaration, ".d.mts"],
					[extensions.javascript, ".mjs"],
				];
			case ".json":
				return [
					[extensions.declaration, ".d.json.ts"],
					[extensions.json, ".json"],
				];
			case ".jsx":
			case ".tsx":
				return [
					[extensions.typescript, ".tsx"],
					[extensions.typescript, ".ts"],
					[extensions.declaration, ".d.ts"],
					[extensions.javascript, ".jsx"],
					[extensions.javascript, ".js"],
				];
			default:
				// https://github.com/microsoft/typescript-go/blob/89d5d5b2849a0db0957065889ca58536fa6d2e4a/internal/module/resolver.go#L1569-L1582
				return [
					[
						getTSExtraSupportedExtensions().has(originalExtension),
						originalExtension,
					],
					[extensions.declaration, `.d${originalExtension}.ts`],
				];
		}
	})();

	for (const [enabled, extension] of candidates) {
		if (enabled) {
			yield { path: stem + extension };
		}
	}
}

// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/moduleNameResolver.ts#L526-L531
function getCandidateFromTypeRoot(typeRoot: string, typeName: string): string {
	return join(
		typeRoot,
		typeRoot.endsWith("/node_modules/@types")
			? mangleScopedPackageName(typeName)
			: typeName,
	);
}

/**
 * The path's TypeScript extension or extra supported extension, such as `.vue`.
 */
export function getExtension(path: string): string | undefined {
	return (
		knownExtensions.find((extension) => path.endsWith(extension)) ??
		Array.from(getTSExtraSupportedExtensions()).find((extension) =>
			path.endsWith(extension),
		)
	);
}

// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/moduleNameResolver.ts#L501-L508
function getDefaultTypeRoots(directory: string): string[] {
	const typeRoots: string[] = [];
	for (; ; directory = dirname(directory)) {
		typeRoots.push(join(directory, "node_modules/@types"));
		if (dirname(directory) === directory) {
			return typeRoots;
		}
	}
}

// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/moduleNameResolver.ts#L3006-L3089
function* getNodeModulesLookups(
	moduleName: string,
	containingDirectory: string,
	extensions: ExtensionKinds,
	listPackageFiles: (packageDirectory: string) => boolean,
): Generator<ModuleLookup> {
	const packageName = moduleName
		.split("/")
		.slice(0, moduleName.startsWith("@") ? 2 : 1)
		.join("/");
	const rest = moduleName.slice(packageName.length);

	for (let directory = containingDirectory; ; directory = dirname(directory)) {
		if (basename(directory) !== "node_modules") {
			const packages: [string, ExtensionKinds][] = [
				[join(directory, "node_modules", packageName), extensions],
			];
			if (extensions.declaration) {
				packages.push([
					join(
						directory,
						"node_modules/@types",
						mangleScopedPackageName(packageName),
					),
					declarationExtensions,
				]);
			}
			for (const [packageDirectory, packageExtensions] of packages) {
				yield {
					path: join(packageDirectory, "package.json"),
					scope: packageDirectory,
				};
				// Without a package.json, TypeScript still loads files from the package directory, such as SvelteKit's generated node_modules/$app.
				if (listPackageFiles(packageDirectory)) {
					yield* getRelativeLookups(packageDirectory + rest, packageExtensions);
				}
			}
		}

		if (dirname(directory) === directory) {
			return;
		}
	}
}

// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/moduleNameResolver.ts#L1567-L1580
function* getPathsLookups(
	moduleName: string,
	options: ts.CompilerOptions,
): Generator<ModuleLookup> {
	// TypeScript 6 deprecates `baseUrl`, so `paths` resolve from the config that sets them.
	const { paths, pathsBasePath } = options;
	if (!paths || !pathsBasePath) {
		return;
	}

	for (const substitution of getPathsSubstitutions(moduleName, paths) ?? []) {
		const candidate = resolve(pathsBasePath, substitution);
		// A path mapping may have an extension, unlike an import.
		if (getExtension(substitution)) {
			yield { path: candidate };
		}
		yield* getRelativeLookups(candidate, allExtensions);
	}
}

// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/moduleNameResolver.ts#L3216-L3224
function mangleScopedPackageName(packageName: string): string {
	return packageName.startsWith("@") && packageName.includes("/")
		? packageName.slice(1).replace("/", "__")
		: packageName;
}

/**
 * The substitutions of the `paths` pattern that best matches the module name, with `*` replaced.
 * Mirrors `matchPatternOrExact`: an exact key wins, then the matching pattern with the longest prefix.
 */
function getPathsSubstitutions(
	moduleName: string,
	paths: ts.MapLike<string[]>,
): string[] | undefined {
	if (Object.hasOwn(paths, moduleName)) {
		return paths[moduleName];
	}

	let matchedKey: string | undefined;
	let matchedPrefixLength = -1;
	let matchedText = "";
	for (const key of Object.keys(paths)) {
		const [prefix, suffix, ...rest] = key.split("*");
		if (
			prefix === undefined ||
			suffix === undefined ||
			rest.length ||
			prefix.length <= matchedPrefixLength ||
			moduleName.length < prefix.length + suffix.length ||
			!moduleName.startsWith(prefix) ||
			!moduleName.endsWith(suffix)
		) {
			continue;
		}
		matchedKey = key;
		matchedPrefixLength = prefix.length;
		matchedText = moduleName.slice(
			prefix.length,
			moduleName.length - suffix.length,
		);
	}

	return matchedKey === undefined
		? undefined
		: paths[matchedKey]?.map((substitution) =>
				substitution.replace("*", matchedText),
			);
}

// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/moduleNameResolver.ts#L1986-L2105
function* getRelativeLookups(
	candidate: string,
	extensions: ExtensionKinds,
): Generator<ModuleLookup> {
	if (basename(candidate).includes(".")) {
		const extension =
			getExtension(candidate) ?? candidate.slice(candidate.lastIndexOf("."));
		yield* addExtensions(
			candidate.slice(0, -extension.length),
			extension,
			extensions,
		);
	}
	yield* addExtensions(candidate, "", extensions);
	yield { path: join(candidate, "package.json"), scope: candidate };
	yield* addExtensions(join(candidate, "index"), "", extensions);
}

/**
 * The candidate's path under each other `rootDirs` entry, relative to the longest entry that contains it.
 */
// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/moduleNameResolver.ts#L1582-L1654
function getRootDirsCandidates(
	candidate: string,
	rootDirs: readonly string[] | undefined,
): string[] {
	if (!rootDirs) {
		return [];
	}

	const prefixes = rootDirs.map((rootDir) =>
		rootDir.endsWith("/") ? rootDir : `${rootDir}/`,
	);
	const matchedPrefix = prefixes
		.filter((prefix) => candidate.startsWith(prefix))
		.reduce<string | undefined>(
			(longest, prefix) =>
				longest === undefined || longest.length < prefix.length
					? prefix
					: longest,
			undefined,
		);
	if (matchedPrefix === undefined) {
		return [];
	}

	const relativePath = candidate.slice(matchedPrefix.length);
	return prefixes
		.filter((prefix) => prefix !== matchedPrefix)
		.map((prefix) => prefix + relativePath);
}

function* withModuleSuffixes(
	lookups: Iterable<ModuleLookup>,
	moduleSuffixes: readonly string[] | undefined,
): Generator<ModuleLookup> {
	for (const lookup of lookups) {
		// TypeScript reads package.json files directly, and tries every other file with each suffix in turn:
		// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/moduleNameResolver.ts#L2189-L2197
		if (lookup.scope || !moduleSuffixes?.length) {
			yield lookup;
			continue;
		}

		const extension = getExtension(lookup.path) ?? "";
		const stem = lookup.path.slice(0, lookup.path.length - extension.length);
		for (const suffix of moduleSuffixes) {
			yield { path: stem + suffix + extension };
		}
	}
}
