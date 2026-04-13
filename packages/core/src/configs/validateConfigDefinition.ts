import { inspect } from "node:util";

import type { AnyLevelDeep } from "../types/arrays.ts";
import type {
	ConfigDefinition,
	ConfigRuleDefinition,
} from "../types/configs.ts";
import { flatten } from "../utils/arrays.ts";

export function validateConfigDefinition(
	definition: ConfigDefinition,
	configFilePath: string,
) {
	const checkRules = (
		rulesValue: AnyLevelDeep<ConfigRuleDefinition> | undefined,
		useIndex: number,
	) => {
		const flattenedRules = rulesValue
			? (flatten(rulesValue) as (ConfigRuleDefinition | undefined)[])
			: undefined;

		if (flattenedRules && !flattenedRules.includes(undefined)) {
			return undefined;
		}

		return `Invalid configuration in ${configFilePath}
  at use[${useIndex}]
  Received: ${inspect(rulesValue)}

This usually means a rule or preset resolved to \`undefined\` at runtime.
Common causes:
  • Typo in the rule or preset name
  • Importing from the wrong package
  • Using untyped or dynamically constructed config
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
