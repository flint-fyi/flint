import { CachedFactory } from "cached-factory";

import type { AnyRule } from "../types/rules.ts";
import type { ConfigUseDefinitionWithFiles } from "./computeUseDefinitions.ts";

export function collectRulesOptionsByFile(
	useDefinitions: ConfigUseDefinitionWithFiles[],
): Map<AnyRule, Map<string, unknown>> {
	const rulesOptionsByFile = new CachedFactory<AnyRule, Map<string, unknown>>(
		() => new Map(),
	);

	for (const use of useDefinitions) {
		for (const ruleDefinition of use.rules) {
			const [options, rule] =
				"rule" in ruleDefinition
					? [ruleDefinition.options, ruleDefinition.rule]
					: [{}, ruleDefinition];

			for (const filePath of use.found) {
				rulesOptionsByFile.get(rule).set(filePath, options);
			}
		}
	}

	return new Map(rulesOptionsByFile.entries());
}
