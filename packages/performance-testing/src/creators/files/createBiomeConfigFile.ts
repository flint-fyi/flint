import schema from "@biomejs/biome/configuration_schema.json" with { type: "json" };

import type { TestCaseRules } from "../../testCases.ts";
import { comparedRules } from "./rules.ts";

const biomeRuleGroups = [
	"a11y",
	"complexity",
	"correctness",
	"nursery",
	"performance",
	"security",
	"style",
	"suspicious",
] as const;

export function createBiomeConfigFile(rules: TestCaseRules): object {
	const enabled = new Map<string, Record<string, "error">>();

	for (const name of comparedRules[rules].flatMap(({ biome }) => biome)) {
		const group = findBiomeRuleGroup(name);
		const groupRules = enabled.get(group) ?? {};
		groupRules[name] = "error";
		enabled.set(group, groupRules);
	}

	const configuredRules = Object.fromEntries(
		[...enabled, ["preset", "none"]].sort(([a], [b]) => a.localeCompare(b)),
	) as Record<string, "none" | Record<string, "error">>;

	return {
		linter: {
			includes: ["src/**/*.ts"],
			rules: configuredRules,
		},
	};
}

function findBiomeRuleGroup(name: string): string {
	const group = biomeRuleGroups.find((candidate) =>
		Object.hasOwn(
			schema.$defs[
				`${candidate.charAt(0).toUpperCase()}${candidate.slice(1)}` as Capitalize<
					typeof candidate
				>
			].properties,
			name,
		),
	);

	if (!group) {
		throw new Error(`No Biome group is known for ${name}.`);
	}

	return group;
}
