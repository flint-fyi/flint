import type { Config, ConfigDefinition } from "../types/configs.ts";

/**
 * Defines a new linter configuration for a Flint config file.
 * @see [flint.fyi/configuration](https://flint.fyi/configuration)
 */
export function defineConfig(definition: ConfigDefinition): Config {
	return {
		definition,
		isFlintConfig: true,
	};
}
