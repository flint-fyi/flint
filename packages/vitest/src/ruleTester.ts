import { describe, it } from "vitest";

import { RuleTester } from "@flint.fyi/rule-tester";
import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

export function createRuleTester(
	additionalFiles: Record<string, string> = {},
): RuleTester {
	return new RuleTester({
		defaults: {
			fileName: "file.ts",
			files: {
				...createRuleTesterTSConfig({
					types: ["vitest/globals", "node"],
				}),
				...additionalFiles,
			},
		},
		describe,
		diskBackedFSRoot: import.meta.dirname,
		it,
	});
}

export const ruleTester = createRuleTester();
