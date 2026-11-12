import { resolve } from "pathe";

import type { LinterHost } from "@flint.fyi/core";
import { pathKey } from "@flint.fyi/utils";

import { findNearestConfigFile } from "./findNearestConfigFile.ts";

/**
 * Orders files so that files sharing a nearest TypeScript config are linted
 * consecutively, which lets the project session reuse each program instead of
 * thrashing between projects.
 *
 * This groups by walking up to the nearest config file rather than building a
 * throwaway project session: ordering only affects lint sequencing, so it does
 * not need a bound program, and building one here would duplicate all of the
 * work `createTypeScriptProjectSession` does again when files are opened.
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

	const configFilePathByDirectory = new Map<string, string | undefined>();

	return filePaths
		.map((filePath) => {
			const absolutePath = resolve(currentDirectory, filePath);
			const configFilePath = findNearestConfigFile(
				host,
				absolutePath,
				configFilePathByDirectory,
			);
			return {
				// Files with no config sort last.
				configKey:
					configFilePath === undefined
						? "\uffff"
						: pathKey(configFilePath, caseSensitiveFileSystem),
				fileKey: pathKey(absolutePath, caseSensitiveFileSystem),
				filePath,
			};
		})
		.toSorted((left, right) => {
			if (left.configKey !== right.configKey) {
				return left.configKey < right.configKey ? -1 : 1;
			}
			return left.fileKey.localeCompare(right.fileKey);
		})
		.map(({ filePath }) => filePath);
}
