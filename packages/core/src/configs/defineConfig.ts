import type { Config, ConfigDefinition } from "../types/configs.ts";

/**
 * Defines a new linter configuration for a Flint config file.
 * @see {@link https://flint.fyi/configuration|flint.fyi/configuration}
 */
export function defineConfig(definition: ConfigDefinition): Config {
	return {
		definition,
		isFlintConfig: true,
	};
}
