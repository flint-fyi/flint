import { RuleTester } from "@flint.fyi/rule-tester";
import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";
import { describe, it } from "vitest";

export const ruleTester = new RuleTester({
	defaults: { fileName: "file.tsx", files: createRuleTesterTSConfig() },
	describe,
	it,
});
