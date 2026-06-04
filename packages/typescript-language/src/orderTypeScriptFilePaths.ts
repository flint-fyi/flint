import { dirname, resolve } from "pathe";
import ts from "typescript";

import type { LinterHost } from "@flint.fyi/core";
import { normalizePath, pathKey, type PathKey } from "@flint.fyi/utils";

import { createTypeScriptServerHost } from "./createTypeScriptServerHost.ts";

interface FilePathInfo {
	absolute: string;
	original: string;
	rootConfig: string | undefined;
	rootConfigKey: PathKey | undefined;
}

interface ParsedConfigInfo {
	fileNames: string[];
	references: string[];
}

const tsConfigFileName = "tsconfig.json";

export function orderTypeScriptFilePaths(
	filePaths: readonly string[],
	host: LinterHost,
): string[] {
	if (filePaths.length < 2) {
		return [...filePaths];
	}

	const caseSensitiveFS = host.isCaseSensitiveFS();
	const cwd = host.getCurrentDirectory();
	const serverHost = createTypeScriptServerHost(host);
	const parseHost: ts.ParseConfigFileHost = {
		...serverHost,
		onUnRecoverableConfigFileDiagnostic() {
			// Keep ordering best-effort; ProjectService reports config diagnostics.
		},
	};
	const configByDirectory = new Map<PathKey, string | undefined>();
	const parsedConfigByPath = new Map<PathKey, ParsedConfigInfo | undefined>();
	const configByFile = new Map<PathKey, string>();

	function comparePaths(a: string, b: string) {
		return pathKey(a, caseSensitiveFS).localeCompare(
			pathKey(b, caseSensitiveFS),
		);
	}

	function findConfigFile(directoryPath: string) {
		const directoryPathNormalized = normalizePath(directoryPath);
		const directoryKey = pathKey(directoryPathNormalized, caseSensitiveFS);
		if (configByDirectory.has(directoryKey)) {
			return configByDirectory.get(directoryKey);
		}

		const configPath = ts.findConfigFile(
			directoryPathNormalized,
			(path) => parseHost.fileExists(path),
			tsConfigFileName,
		);
		const normalizedConfigPath =
			configPath == null ? undefined : resolve(cwd, configPath);

		configByDirectory.set(directoryKey, normalizedConfigPath);
		return normalizedConfigPath;
	}

	function getParsedConfig(configPath: string) {
		const configKey = pathKey(configPath, caseSensitiveFS);
		if (parsedConfigByPath.has(configKey)) {
			return parsedConfigByPath.get(configKey);
		}

		const parsed = ts.getParsedCommandLineOfConfigFile(
			configPath,
			{},
			parseHost,
		);
		const parsedConfig =
			parsed == null
				? undefined
				: {
						fileNames: parsed.fileNames.map((fileName) =>
							resolve(cwd, fileName),
						),
						references: (parsed.projectReferences ?? [])
							.map((reference) =>
								resolve(cwd, ts.resolveProjectReferencePath(reference)),
							)
							.sort(comparePaths),
					};

		parsedConfigByPath.set(configKey, parsedConfig);
		return parsedConfig;
	}

	function collectConfigsTopologically(configPath: string) {
		const orderedConfigs: string[] = [];
		const seen = new Set<PathKey>();
		const visiting = new Set<PathKey>();

		function visit(currentConfigPath: string) {
			const configKey = pathKey(currentConfigPath, caseSensitiveFS);
			if (seen.has(configKey) || visiting.has(configKey)) {
				return;
			}

			visiting.add(configKey);
			for (const reference of getParsedConfig(currentConfigPath)?.references ??
				[]) {
				visit(reference);
			}
			visiting.delete(configKey);
			seen.add(configKey);
			orderedConfigs.push(currentConfigPath);
		}

		visit(configPath);
		return orderedConfigs;
	}

	const fileInfos = filePaths.map((original): FilePathInfo => {
		const absolute = resolve(cwd, original);
		const rootConfig = findConfigFile(dirname(absolute));
		return {
			absolute,
			original,
			rootConfig,
			rootConfigKey:
				rootConfig == null ? undefined : pathKey(rootConfig, caseSensitiveFS),
		};
	});
	const rootConfigs = Array.from(
		new Set(
			fileInfos
				.map(({ rootConfig }) => rootConfig)
				.filter((rootConfig) => rootConfig != null),
		),
	).sort(comparePaths);
	const fileInfoByPath = new Map(
		fileInfos.map((fileInfo) => [
			pathKey(fileInfo.absolute, caseSensitiveFS),
			fileInfo,
		]),
	);
	const configRanks = new Map<PathKey, number>();

	for (const rootConfig of rootConfigs) {
		const rootConfigKey = pathKey(rootConfig, caseSensitiveFS);
		for (const config of collectConfigsTopologically(rootConfig)) {
			const configKey = pathKey(config, caseSensitiveFS);
			if (!configRanks.has(configKey)) {
				configRanks.set(configKey, configRanks.size);
			}

			for (const fileName of getParsedConfig(config)?.fileNames ?? []) {
				const fileInfo = fileInfoByPath.get(pathKey(fileName, caseSensitiveFS));
				if (fileInfo?.rootConfigKey !== rootConfigKey) {
					continue;
				}

				const fileKey = pathKey(fileInfo.absolute, caseSensitiveFS);
				if (!configByFile.has(fileKey)) {
					configByFile.set(fileKey, config);
				}
			}
		}
	}

	return fileInfos
		.toSorted((a, b) => {
			const configA =
				configByFile.get(pathKey(a.absolute, caseSensitiveFS)) ?? a.rootConfig;
			const configB =
				configByFile.get(pathKey(b.absolute, caseSensitiveFS)) ?? b.rootConfig;
			const rankA =
				configA == null
					? Number.MAX_SAFE_INTEGER
					: (configRanks.get(pathKey(configA, caseSensitiveFS)) ??
						Number.MAX_SAFE_INTEGER);
			const rankB =
				configB == null
					? Number.MAX_SAFE_INTEGER
					: (configRanks.get(pathKey(configB, caseSensitiveFS)) ??
						Number.MAX_SAFE_INTEGER);

			return rankA - rankB || comparePaths(a.absolute, b.absolute);
		})
		.map(({ original }) => original);
}
