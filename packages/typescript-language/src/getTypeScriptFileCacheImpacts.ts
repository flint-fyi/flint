import { basename, dirname, isAbsolute, join, resolve } from "pathe";
import ts from "typescript";

import type {
	LanguageFile,
	LanguageFileCacheImpacts,
	LinterHost,
} from "@flint.fyi/core";

import { collectReferencedFilePaths } from "./collectReferencedFilePaths.ts";
import { createTypeScriptServerHost } from "./createTypeScriptServerHost.ts";
import {
	getExtension,
	getTypeReferenceLookups,
	type ModuleLookup,
} from "./getModuleLookups.ts";
import type * as AST from "./types/ast.ts";
import type { TypeScriptFileServices } from "./types/services.ts";
import { containsGlobalDeclarations } from "./utils/containsGlobalDeclarations.ts";

export interface ProgramCacheImpacts {
	/**
	 * Program files with global declarations that aren't default libraries, such as installed `@types` packages.
	 */
	globalDeclarationFilePaths: string[];

	/**
	 * Missing files the program's configs name: literal `files` and `include` entries,
	 * and paths their `extends` and `types` entries resolve through.
	 */
	missingConfigTargetPaths: string[];
}

const programCacheImpactsByProgram = new WeakMap<
	ts.Program,
	ProgramCacheImpacts
>();

export function getTypeScriptFileCacheImpacts(
	file: LanguageFile<TypeScriptFileServices>,
	host: LinterHost,
): LanguageFileCacheImpacts {
	const { program, sourceFile } = file.services;
	const compilerOptions = program.getCompilerOptions();
	const { configFile, configFilePath } = compilerOptions;
	const packageDirectory = program.getSourceFile(sourceFile.fileName)
		?.packageJsonScope?.packageDirectory;
	const packageJsonPath =
		packageDirectory === undefined
			? undefined
			: join(packageDirectory, "package.json");
	const programCacheImpacts = getProgramCacheImpacts(program, host);
	const referenced = collectReferencedFilePaths(
		program,
		sourceFile,
		createTypeScriptServerHost(host),
	);

	const dependencies = new Set(
		[
			configFilePath,
			...(configFile?.extendedSourceFiles ?? []),
			packageJsonPath,
			...referenced.dependencies,
			...programCacheImpacts.globalDeclarationFilePaths,
		].filter((filePath) => filePath !== undefined),
	);
	const missingDependencies = new Set([
		...referenced.missingDependencies,
		...programCacheImpacts.missingConfigTargetPaths,
	]);

	// The project service picks the closest tsconfig or jsconfig,
	// and under node16 and nodenext resolution the closest package.json decides the module format.
	for (const candidate of [
		...getCloserFilePaths(
			sourceFile.fileName,
			["tsconfig.json", "jsconfig.json"],
			configFilePath,
			host,
		),
		...(usesNodeModuleFormats(compilerOptions)
			? getCloserFilePaths(
					sourceFile.fileName,
					["package.json"],
					packageJsonPath,
					host,
				)
			: []),
	]) {
		(host.fileTypeSync(candidate) === "file"
			? dependencies
			: missingDependencies
		).add(candidate);
	}

	dependencies.delete(sourceFile.fileName);

	return {
		dependencies: Array.from(dependencies),
		isGlobalDependency: containsGlobalDeclarations(sourceFile),
		missingDependencies: Array.from(
			missingDependencies.difference(dependencies),
		),
	};
}

/**
 * Cache impacts shared by every file in a program, computed once per program.
 */
export function getProgramCacheImpacts(
	program: ts.Program,
	host: LinterHost,
): ProgramCacheImpacts {
	const cached = programCacheImpactsByProgram.get(program);
	if (cached) {
		return cached;
	}

	const compilerOptions = program.getCompilerOptions();
	const { configFile, configFilePath, types } = compilerOptions;
	// Closest config first, so the first config that sets a key is the one whose value applies.
	const configFilePaths = configFilePath
		? [configFilePath, ...(configFile?.extendedSourceFiles ?? []).toReversed()]
		: [];
	const listPackageFiles = (packageDirectory: string): boolean =>
		host.fileTypeSync(packageDirectory) === "directory" &&
		host.fileTypeSync(join(packageDirectory, "package.json")) === undefined;

	const programCacheImpacts: ProgramCacheImpacts = {
		globalDeclarationFilePaths: program
			.getSourceFiles()
			.filter(
				(sourceFile) =>
					!program.isSourceFileDefaultLibrary(sourceFile) &&
					containsGlobalDeclarations(sourceFile as AST.SourceFile),
			)
			.map((sourceFile) => sourceFile.fileName),
		missingConfigTargetPaths: configFilePath
			? [
					...getLiteralIncludedFilePaths(configFilePaths, host).filter(
						(filePath) =>
							getExtension(filePath) !== undefined &&
							host.fileTypeSync(filePath) === undefined,
					),
					...configFilePaths.flatMap((filePath) =>
						getUnresolvedLookups(getExtendsLookups(filePath, host), host),
					),
					...(types ?? [])
						.filter((typeName) => typeName !== "*")
						.flatMap((typeName) =>
							getUnresolvedLookups(
								getTypeReferenceLookups(
									typeName,
									dirname(configFilePath),
									compilerOptions,
									listPackageFiles,
								),
								host,
							),
						),
				]
			: [],
	};
	programCacheImpactsByProgram.set(program, programCacheImpacts);

	return programCacheImpacts;
}

/**
 * Paths of `fileNames` in the file's directory and its ancestors, closest first.
 * Stops before `found`, after the first path that exists, or at the directory of `found`, such as a solution config's referenced project.
 */
function getCloserFilePaths(
	filePath: string,
	fileNames: string[],
	found: string | undefined,
	host: LinterHost,
): string[] {
	const candidates: string[] = [];

	for (let directory = dirname(filePath); ; directory = dirname(directory)) {
		for (const fileName of fileNames) {
			const candidate = join(directory, fileName);
			if (candidate === found) {
				return candidates;
			}
			candidates.push(candidate);
			if (host.fileTypeSync(candidate) === "file") {
				return candidates;
			}
		}

		if (
			(found !== undefined && dirname(found) === directory) ||
			dirname(directory) === directory
		) {
			return candidates;
		}
	}
}

/**
 * Paths a config's `extends` entries resolve through, in the order TypeScript checks them.
 * Mirrors `getExtendsConfigPath`:
 * https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/commandLineParser.ts#L3646-L3676
 * It resolves bare names like modules from node_modules.
 */
function* getExtendsLookups(
	configFilePath: string,
	host: LinterHost,
): Generator<ModuleLookup> {
	const configDirectory = dirname(configFilePath);

	for (const spec of [readConfig(configFilePath, host)?.extends].flat()) {
		if (typeof spec !== "string" || !spec) {
			continue;
		}

		if (isAbsolute(spec) || spec.startsWith("./") || spec.startsWith("../")) {
			yield* withJsonExtension(resolve(configDirectory, spec));
			continue;
		}

		const packageName = spec
			.split("/")
			.slice(0, spec.startsWith("@") ? 2 : 1)
			.join("/");
		for (let directory = configDirectory; ; directory = dirname(directory)) {
			if (basename(directory) !== "node_modules") {
				const nodeModules = join(directory, "node_modules");
				yield {
					path: join(nodeModules, packageName, "package.json"),
					scope: join(nodeModules, packageName),
				};
				yield* withJsonExtension(join(nodeModules, spec));
				yield { path: join(nodeModules, spec, "tsconfig.json") };
			}
			if (dirname(directory) === directory) {
				break;
			}
		}
	}
}

/**
 * Literal `files` and `include` entries from the closest config that sets each, resolved against that config.
 */
function getLiteralIncludedFilePaths(
	configFilePaths: string[],
	host: LinterHost,
): string[] {
	const filePaths: string[] = [];

	for (const key of ["files", "include"]) {
		for (const configFilePath of configFilePaths) {
			const specs = readConfig(configFilePath, host)?.[key];
			if (!Array.isArray(specs)) {
				continue;
			}
			const configDirectory = dirname(configFilePath);
			for (const spec of specs) {
				if (typeof spec === "string" && !/[*?]/.test(spec)) {
					filePaths.push(
						resolve(configDirectory, spec.replace(/^\$\{configdir\}/i, ".")),
					);
				}
			}
			break;
		}
	}

	return filePaths;
}

/**
 * Lookup paths before the first one that exists, or every lookup path when none exists.
 */
function getUnresolvedLookups(
	lookups: Iterable<ModuleLookup>,
	host: LinterHost,
): string[] {
	const missing: string[] = [];
	for (const { path } of lookups) {
		if (host.fileTypeSync(path) === "file") {
			return missing;
		}
		missing.push(path);
	}
	return missing;
}

function readConfig(
	configFilePath: string,
	host: LinterHost,
): Record<string, unknown> | undefined {
	return ts.readConfigFile(configFilePath, (filePath) =>
		host.readFileSync(filePath),
	).config as Record<string, unknown> | undefined;
}

function* withJsonExtension(path: string): Generator<ModuleLookup> {
	yield { path };
	if (!path.endsWith(".json")) {
		yield { path: `${path}.json` };
	}
}

// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/utilities.ts#L9077-L9098
function usesNodeModuleFormats(options: ts.CompilerOptions): boolean {
	if (options.moduleResolution !== undefined) {
		return (
			options.moduleResolution === ts.ModuleResolutionKind.Node16 ||
			options.moduleResolution === ts.ModuleResolutionKind.NodeNext
		);
	}

	return (
		options.module !== undefined &&
		options.module >= ts.ModuleKind.Node16 &&
		options.module <= ts.ModuleKind.NodeNext
	);
}
