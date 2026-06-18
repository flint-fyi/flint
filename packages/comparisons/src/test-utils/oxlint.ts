import { comparisons } from "../index.ts";

interface OxlintSchema {
	definitions?: {
		DummyRuleMap?: {
			properties?: Record<string, unknown>;
		};
	};
}

export function findOxlintRulesInFlint() {
	return comparisons.flatMap((comparison) => comparison.oxlint ?? []);
}

export async function getOxlintLintRules() {
	const schema = (await import(
		new URL(
			"configuration_schema.json",
			import.meta.resolve("oxlint/package.json"),
		).toString()
	)) as OxlintSchema;
	const properties = schema.definitions?.DummyRuleMap?.properties;

	if (!properties) {
		throw new Error(
			"Could not find Oxlint rules in configuration_schema.json.",
		);
	}

	return Object.keys(properties).sort();
}

export function getOxlintRuleConfigName(ruleName: string) {
	return ruleName.startsWith("eslint/")
		? ruleName.slice("eslint/".length)
		: ruleName;
}
