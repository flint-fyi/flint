import path from "pathe";

import type { LinterHost } from "@flint.fyi/core";

/**
 * Walks up from a file's directory to the nearest config file, by default a
 * `tsconfig.json` or `jsconfig.json`, remembering the answer for every
 * directory walked.
 */
export function findNearestConfigFile(
	host: LinterHost,
	filePath: string,
	configFilePathByDirectory: Map<string, string | undefined>,
	configFileNames: readonly string[] = ["tsconfig.json", "jsconfig.json"],
): string | undefined {
	const visitedDirectories: string[] = [];
	let directory = path.dirname(filePath);
	let nearest: string | undefined;
	while (true) {
		if (configFilePathByDirectory.has(directory)) {
			nearest = configFilePathByDirectory.get(directory);
			break;
		}
		visitedDirectories.push(directory);
		nearest = configFileNames
			.map((configName) => path.join(directory, configName))
			.find((configFilePath) => host.fileTypeSync(configFilePath) === "file");
		const parent = path.dirname(directory);
		if (nearest || parent === directory) {
			break;
		}
		directory = parent;
	}
	for (const visitedDirectory of visitedDirectories) {
		configFilePathByDirectory.set(visitedDirectory, nearest);
	}
	return nearest;
}
