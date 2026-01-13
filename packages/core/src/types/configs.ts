import type { AnyLevelDeep } from "./arrays.ts";
import type { FilesValue } from "./files.ts";
import type { AnyRule } from "./rules.ts";

export interface Config {
	definition: ConfigDefinition;
	isFlintConfig: true;
}

export interface ConfigDefinition {
	from?: string;
	ignore?: string[];
	use: ConfigUseDefinition[];
	workspaces?: string[];
}

export type ConfigRuleDefinition = AnyRule | ConfigRuleDefinitionObject;

export interface ConfigRuleDefinitionObject {
	options: unknown;
	rule: AnyRule;
}

export interface ConfigUseDefinition {
	files: AnyLevelDeep<FilesValue>;
	rules: AnyLevelDeep<ConfigRuleDefinition>;
}

/**
 * Representation of a config that's been loaded from disk.
 */
export interface ProcessedConfigDefinition extends ConfigDefinition {
	/**
	 * Original file path of the loaded config file.
	 */
	filePath: string;
}
