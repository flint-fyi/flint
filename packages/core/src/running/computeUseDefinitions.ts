import { debugForFile } from "debug-for-file";

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
	host: LinterHost,
	configDefinition: ProcessedConfigDefinition,
): Promise<ComputedUseDefinitions> {
	log("Collecting files from %d use pattern(s)", configDefinition.use.length);

	const cwd = host.getCurrentDirectory();
	const gitignoreFilter = createGitignoreFilter(cwd, host);

	const allFilePaths = new Set<string>();

	const useDefinitions = await Promise.all(
		configDefinition.use.map(async (use) => {
			const globs = resolveUseFilesGlobs(use.files, configDefinition);
			const matches = await host.glob([globs.include].flat(), {
				cwd,
				exclude: globs.exclude,
			});

			const found = new Set<string>();
			for (const filePathAbsolute of matches) {
				if (gitignoreFilter(filePathAbsolute)) {
					found.add(filePathAbsolute);
					allFilePaths.add(filePathAbsolute);
				}
			}

			return {
				...use,
				found,
				rules: flatten(use.rules),
			};
		}),
	);

	return { allFilePaths, useDefinitions };
}
