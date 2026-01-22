import type { AnyLevelDeep } from "../types/arrays.ts";
import type {
	ConfigDefinition,
	ConfigRuleDefinition,
} from "../types/configs.ts";

export function validateConfigDefinition(
	definition: ConfigDefinition,
	configFilePath: string,
) {
	const checkRules = (
		rulesValue: AnyLevelDeep<ConfigRuleDefinition> | undefined,
		useIndex: number,
	) => {
		return rulesValue
			? undefined
			: `Invalid configuration in ${configFilePath}
  at use[${useIndex}]
  Received: ${String(rulesValue)}

This often happens when a preset or rule doesn't exist.
Common causes:
  • Typo in the preset or rule name
  • Using a preset that hasn't been implemented yet
  • Importing from the wrong package
`;
	};

	for (const [useIndex, use] of definition.use.entries()) {
		const error = checkRules(use.rules, useIndex);
		if (error) {
			return error;
		}
	}

	return undefined;
}
