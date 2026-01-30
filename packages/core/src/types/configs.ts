import type { defineConfig } from "../configs/defineConfig.ts";
import type { AnyLevelDeep } from "./arrays.ts";
import type { FilesValue } from "./files.ts";
import type { AnyRule } from "./rules.ts";

/**
 * Wrapper object for a config, as defined by {@link ConfigDefinition}.
 * @see {@link https://flint.fyi/configuration|flint.fyi/configuration}
 */
export interface Config {
	/**
	 * Underling config definition as passed to {@link defineConfig}.
	 */
	definition: ConfigDefinition;

	/**
	 * @internal
	 */
	isFlintConfig: true;
}

/**
 * Definition of a new linter configuration for a Flint config file,
 * as is typically passed to {@link defineConfig}.
 */
export interface ConfigDefinition {
	/**
	 * @see https://github.com/flint-fyi/flint/issues/64
	 */
	from?: string;

	/**
	 * A list of glob patterns to ignore from linting.
	 * `ignore` by default includes all patterns defined in a `.gitignore` file, if it exists.
	 * @see {@link https://flint.fyi/configuration#ignore|flint.fyi/configuration#ignore}
	 */
	ignore?: string[];

	/**
	 * Specifies the files to be linted alongside the rules and settings to lint with.
	 * @see {@link https://flint.fyi/configuration#use|flint.fyi/configuration#use}
	 */
	use: ConfigUseDefinition[];

	/**
	 * @see https://github.com/flint-fyi/flint/issues/64
	 */
	workspaces?: string[];
}

/**
 * A rule or presets of rules to enable in a {@link ConfigUseDefinition}.
 */
export type ConfigRuleDefinition = AnyRule | ConfigRuleDefinitionObject;

export interface ConfigRuleDefinitionObject {
	options: boolean | object;
	rule: AnyRule;
}

/**
 * An entry in the {@link ConfigDefinition} `use` array of a Flint config.
 * @see {@link https://flint.fyi/configuration#use|flint.fyi/configuration#use}
 */
export interface ConfigUseDefinition {
	/**
	 * A list of glob patterns describing which file(s) to lint.
	 * @see {@link https://flint.fyi/configuration#files|flint.fyi/configuration#files}
	 */
	files: AnyLevelDeep<FilesValue>;

	/**
	 * Any number of rules and/or presets of rules to enable for those files.
	 * @see {@link https://flint.fyi/configuration#rules|flint.fyi/configuration#rules}
	 */
	rules: AnyLevelDeep<ConfigRuleDefinition>;
}

/**
 * Representation of a config that's been loaded from disk.
 * @internal
 */
export interface ProcessedConfigDefinition extends ConfigDefinition {
	/**
	 * Original file path of the loaded config file.
	 */
	filePath: string;
}
