import type { ConfigDefinition } from "../types/configs.ts";

export function validateConfigDefinition(
	definition: ConfigDefinition,
	configFilePath: string,
) {
	const checkRules = (rulesValue: unknown, useIndex: number) => {
		if (!rulesValue) {
			return `Invalid configuration in ${configFilePath}
  at use[${useIndex}]
  Received: ${rulesValue}

This often happens when a preset or rule doesn't exist.
Common causes:
  • Typo in the preset or rule name
  • Using a preset that hasn't been implemented yet
  • Importing from the wrong package
`;
		}

		return undefined;
	};

	for (const [useIndex, use] of definition.use.entries()) {
		const error = checkRules(use.rules, useIndex);
		if (error) {
			return error;
		}
	}

	return undefined;
}
