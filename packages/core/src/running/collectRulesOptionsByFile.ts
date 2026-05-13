import { CachedFactory } from "cached-factory";

import type { AnyRule } from "../types/rules.ts";
import type { ConfigUseDefinitionWithFiles } from "./computeUseDefinitions.ts";

export function collectRulesOptionsByFile(
	useDefinitions: ConfigUseDefinitionWithFiles[],
): Map<AnyRule, Map<string, object>> {
	const rulesOptionsByFile = new CachedFactory<AnyRule, Map<string, object>>(
		() => new Map(),
	);

	for (const use of useDefinitions) {
		for (const ruleDefinition of use.rules) {
			const [options, rule] =
				"rule" in ruleDefinition
					? [ruleDefinition.options, ruleDefinition.rule]
					: [true, ruleDefinition];

			const perFile = rulesOptionsByFile.get(rule);

			for (const filePath of use.found) {
				if (options === false) {
					perFile.delete(filePath);
					continue;
				}

				if (options === true) {
					if (!perFile.has(filePath)) {
						perFile.set(filePath, {});
					}
					continue;
				}

				perFile.set(filePath, options);
			}
		}
	}

	return new Map(rulesOptionsByFile.entries());
}
