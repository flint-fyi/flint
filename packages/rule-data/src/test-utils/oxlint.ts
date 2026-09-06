import { ruleData } from "../index.ts";
import type { LinterRuleReference } from "../schemas.ts";

interface OxlintSchema {
	definitions?: {
		DummyRuleMap?: {
			properties?: Record<string, unknown>;
		};
	};
}

export function findOxlintRulesInFlint(): LinterRuleReference[] {
	return ruleData.flatMap((ruleDetails) => ruleDetails.oxlint ?? []);
}

export async function getOxlintLintRules(): Promise<string[]> {
	const { default: schema } = (await import(
		new URL(
			"configuration_schema.json",
			import.meta.resolve("oxlint/package.json"),
		).toString(),
		{ with: { type: "json" } }
	)) as { default: OxlintSchema };
	const properties = schema.definitions?.DummyRuleMap?.properties;

	if (!properties) {
		throw new Error(
			"Could not find Oxlint rules in configuration_schema.json.",
		);
	}

	return Object.keys(properties).sort();
}

export function getOxlintRuleConfigName(ruleName: string): string {
	return ruleName.startsWith("eslint/")
		? ruleName.slice("eslint/".length)
		: ruleName;
}
