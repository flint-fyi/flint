import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { comparisons } from "../index.ts";

interface OxlintSchema {
	definitions?: {
		DummyRuleMap?: {
			properties?: Record<string, unknown>;
		};
	};
}

const require = createRequire(import.meta.dirname);

export function findOxlintRulesInFlint() {
	return comparisons.flatMap((comparison) => comparison.oxlint ?? []);
}

export async function getOxlintLintRules() {
	const oxlintDirectory = path.dirname(require.resolve("oxlint/package.json"));
	const schema = JSON.parse(
		await fs.readFile(
			path.join(oxlintDirectory, "configuration_schema.json"),
			"utf8",
		),
	) as OxlintSchema;
	const properties = schema.definitions?.DummyRuleMap?.properties;

	if (!properties) {
		throw new Error(
			"Could not find Oxlint rules in configuration_schema.json.",
		);
	}

	return Object.keys(properties).sort();
}
