import schema from "@biomejs/biome/configuration_schema.json" with { type: "json" };

import { comparisons } from "../index.ts";

type Defs = typeof schema.$defs;

type DefsWithProperties = {
	[K in keyof Defs as Defs[K] extends { properties: object }
		? K
		: never]: Defs[K];
};

export function findBiomeRulesInFlint() {
	return comparisons.flatMap((comparison) => comparison.biome ?? []);
}

export function getBiomeLintRules() {
	return Array.from(
		new Set([
			...collectRulesIn("A11y"),
			...collectRulesIn("Complexity"),
			...collectRulesIn("Correctness"),
			...collectRulesIn("Nursery"),
			...collectRulesIn("Performance"),
			...collectRulesIn("Security"),
			...collectRulesIn("Style"),
			...collectRulesIn("Suspicious"),
		]),
	).sort();
}

function collectRulesIn(key: keyof DefsWithProperties) {
	return Object.keys(schema.$defs[key].properties).filter(
		(ruleName) => ruleName !== "recommended",
	);
}
