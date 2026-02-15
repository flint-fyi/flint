import { debugForFile } from "debug-for-file";
import * as fs from "node:fs/promises";
import path from "node:path";

import { normalizePath } from "../host/normalizePath.ts";
import type {
	ConfigRuleDefinition,
	ConfigUseDefinition,
	ProcessedConfigDefinition,
} from "../types/configs.ts";
import type { LinterHost } from "../types/host.ts";
import { flatten } from "../utils/arrays.ts";
import { createGitignoreFilter } from "./createGitignoreFilter.ts";
import { resolveUseFilesGlobs } from "./resolveUseFilesGlobs.ts";

const log = debugForFile(import.meta.filename);

export interface ComputedUseDefinitions {
	allFilePaths: Set<string>;
	useDefinitions: ConfigUseDefinitionWithFiles[];
}

export interface ConfigUseDefinitionWithFiles extends ConfigUseDefinition {
	found: Set<string>;
	rules: ConfigRuleDefinition[];
}

export async function computeUseDefinitions(
	configDefinition: ProcessedConfigDefinition,
	host: LinterHost,
): Promise<ComputedUseDefinitions> {
	log("Collecting files from %d use pattern(s)", configDefinition.use.length);

	const allFilePaths = new Set<string>();
	const cwd = host.getCurrentDirectory();
	const gitignoreFilter = createGitignoreFilter(cwd, host);

	const useDefinitions = await Promise.all(
		configDefinition.use.map(async (use) => {
			const globs = resolveUseFilesGlobs(use.files, configDefinition);
			const foundFilePaths = (
				await Array.fromAsync(
					fs.glob([globs.include].flat(), {
						cwd,
						exclude: globs.exclude,
						withFileTypes: true,
					}),
				)
			)
				.map((entry) =>
					entry.isFile()
						? normalizePath(
								path.join(entry.parentPath, entry.name),
								host.isCaseSensitiveFS(),
							)
						: null,
				)
				.filter(
					(absolutePath): absolutePath is string =>
						absolutePath !== null && gitignoreFilter(absolutePath),
				);

			for (const foundFilePath of foundFilePaths) {
				allFilePaths.add(foundFilePath);
			}

			return {
				...use,
				found: new Set(foundFilePaths),
				rules: flatten(use.rules),
			};
		}),
	);

	return { allFilePaths, useDefinitions };
}
