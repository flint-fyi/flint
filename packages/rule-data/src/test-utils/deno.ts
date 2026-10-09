import { z } from "zod/v4";

import { ruleData } from "../index.ts";
import type { LinterRuleReference } from "../schemas.ts";

const schemaUrl =
	"https://raw.githubusercontent.com/denoland/deno/v2.9.7/cli/schemas/lint-rules.v1.json";

const lintRulesSchema = z.object({
	oneOf: z.tuple([
		z.object({ pattern: z.string(), type: z.literal("string") }),
		z.object({ enum: z.array(z.string()).nonempty() }),
	]),
});

export function findDenoRulesInFlint(): LinterRuleReference[] {
	return ruleData.flatMap((ruleDetails) => ruleDetails.deno ?? []);
}

export async function getDenoLintRules(): Promise<string[]> {
	const response = await fetch(schemaUrl);

	if (!response.ok) {
		throw new Error(`Could not fetch Deno lint rules: ${response.status}.`);
	}

	return lintRulesSchema.parse(await response.json()).oneOf[1].enum;
}
