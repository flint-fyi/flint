import path from "node:path";

import { resolve } from "pathe";

import type { LinterHost } from "@flint.fyi/core";
import { pathKey } from "@flint.fyi/utils";

const configFileNames = ["tsconfig.json", "jsconfig.json"];

/**
 * Orders files so that files sharing a nearest TypeScript config are linted
 * consecutively, which lets the project session reuse each program instead of
 * thrashing between projects.
 *
 * This groups by walking up to the nearest config file rather than building a
 * throwaway project session: ordering only affects lint sequencing, so it does
 * not need a bound program, and building one here would duplicate all of the
 * work {@link createTypeScriptProjectSession} does again when files are opened.
 */
export function orderTypeScriptFilePaths(
	filePaths: readonly string[],
	host: LinterHost,
): string[] {
	if (filePaths.length < 2) {
		return [...filePaths];
	}

	const caseSensitiveFileSystem = host.isCaseSensitiveFS();
	const currentDirectory = host.getCurrentDirectory();

	const configByDirectory = new Map<string, string | undefined>();
	const findConfigFile = (filePath: string): string | undefined => {
		let directory = path.dirname(filePath);
		const walked: string[] = [];
		while (true) {
			const cached = configByDirectory.get(directory);
			if (cached !== undefined || configByDirectory.has(directory)) {
				for (const walkedDirectory of walked) {
					configByDirectory.set(walkedDirectory, cached);
				}
				return cached;
			}
			walked.push(directory);

			let configFilePath: string | undefined;
			for (const configName of configFileNames) {
				const candidate = path.join(directory, configName);
				if (host.fileTypeSync(candidate) === "file") {
					configFilePath = candidate;
					break;
				}
			}
			if (configFilePath) {
				for (const walkedDirectory of walked) {
					configByDirectory.set(walkedDirectory, configFilePath);
				}
				return configFilePath;
			}

			const parent = path.dirname(directory);
			if (parent === directory) {
				for (const walkedDirectory of walked) {
					configByDirectory.set(walkedDirectory, undefined);
				}
				return undefined;
			}
			directory = parent;
		}
	};

	const absolutePaths = new Map(
		filePaths.map((filePath) => [
			filePath,
			resolve(currentDirectory, filePath),
		]),
	);
	const configKeyByFilePath = new Map(
		filePaths.map((filePath) => {
			const configFilePath = findConfigFile(
				absolutePaths.get(filePath) ?? filePath,
			);
			return [
				filePath,
				configFilePath == null
					? "￿"
					: pathKey(configFilePath, caseSensitiveFileSystem),
			];
		}),
	);

	return [...filePaths].sort((left, right) => {
		const leftConfig = configKeyByFilePath.get(left) ?? "￿";
		const rightConfig = configKeyByFilePath.get(right) ?? "￿";
		if (leftConfig !== rightConfig) {
			return leftConfig < rightConfig ? -1 : 1;
		}
		return pathKey(
			absolutePaths.get(left) ?? left,
			caseSensitiveFileSystem,
		).localeCompare(
			pathKey(absolutePaths.get(right) ?? right, caseSensitiveFileSystem),
		);
	});
}
