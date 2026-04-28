import type { LinterHost } from "@flint.fyi/core";
import { normalizePath, pathKey, type PathKey } from "@flint.fyi/utils";
import path from "node:path";
import ts from "typescript";

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
		getCurrentDirectory: () => cwd,
		onUnRecoverableConfigFileDiagnostic() {
			// Keep ordering best-effort; ProjectService reports config diagnostics.
		},
		useCaseSensitiveFileNames: caseSensitiveFS,
	};
	const configByDirectory = new Map<PathKey, string | undefined>();
	const parsedConfigByPath = new Map<PathKey, ParsedConfigInfo | undefined>();
	const configByFile = new Map<PathKey, string>();

	function comparePaths(a: string, b: string) {
		return toComparablePath(a).localeCompare(toComparablePath(b));
	}

	function toComparablePath(filePath: string) {
		const normalized = normalizePath(filePath);
		return caseSensitiveFS ? normalized : normalized.toLowerCase();
	}

	function getPathKey(filePath: string) {
		return pathKey(filePath, caseSensitiveFS);
	}

	function findConfigFile(directoryPath: string) {
		const directoryPathNormalized = normalizePath(directoryPath);
		const directoryKey = getPathKey(directoryPathNormalized);
		if (configByDirectory.has(directoryKey)) {
			return configByDirectory.get(directoryKey);
		}

		const configPath = ts.findConfigFile(
			directoryPathNormalized,
			parseHost.fileExists,
			tsConfigFileName,
		);
		const normalizedConfigPath =
			configPath == null
				? undefined
				: normalizePath(path.resolve(cwd, configPath));

		configByDirectory.set(directoryKey, normalizedConfigPath);
		return normalizedConfigPath;
	}

	function getParsedConfig(configPath: string) {
		const configKey = getPathKey(configPath);
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
							normalizePath(path.resolve(cwd, fileName)),
						),
						references: (parsed.projectReferences ?? [])
							.map((reference) =>
								normalizePath(
									path.resolve(cwd, ts.resolveProjectReferencePath(reference)),
								),
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
			const configKey = getPathKey(currentConfigPath);
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
		const absolute = normalizePath(path.resolve(cwd, original));
		const rootConfig = findConfigFile(path.dirname(absolute));
		return {
			absolute,
			original,
			rootConfig,
			rootConfigKey: rootConfig == null ? undefined : getPathKey(rootConfig),
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
		fileInfos.map((fileInfo) => [getPathKey(fileInfo.absolute), fileInfo]),
	);
	const configRanks = new Map<PathKey, number>();

	for (const rootConfig of rootConfigs) {
		const rootConfigKey = getPathKey(rootConfig);
		for (const config of collectConfigsTopologically(rootConfig)) {
			const configKey = getPathKey(config);
			if (!configRanks.has(configKey)) {
				configRanks.set(configKey, configRanks.size);
			}

			for (const fileName of getParsedConfig(config)?.fileNames ?? []) {
				const fileInfo = fileInfoByPath.get(getPathKey(fileName));
				if (fileInfo?.rootConfigKey !== rootConfigKey) {
					continue;
				}

				const fileKey = getPathKey(fileInfo.absolute);
				if (!configByFile.has(fileKey)) {
					configByFile.set(fileKey, config);
				}
			}
		}
	}

	return fileInfos
		.toSorted((a, b) => {
			const configA = configByFile.get(getPathKey(a.absolute)) ?? a.rootConfig;
			const configB = configByFile.get(getPathKey(b.absolute)) ?? b.rootConfig;
			const rankA =
				configA == null
					? Number.MAX_SAFE_INTEGER
					: (configRanks.get(getPathKey(configA)) ?? Number.MAX_SAFE_INTEGER);
			const rankB =
				configB == null
					? Number.MAX_SAFE_INTEGER
					: (configRanks.get(getPathKey(configB)) ?? Number.MAX_SAFE_INTEGER);

			return rankA - rankB || comparePaths(a.absolute, b.absolute);
		})
		.map(({ original }) => original);
}
