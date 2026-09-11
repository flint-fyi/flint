import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { comparedRules, ruleCounts } from "./rules.ts";

describe("comparedRules", () => {
	it("contains the same linter intersection for common and many", () => {
		expect(ruleCounts).toEqual({
			1: 1,
			common: 50,
			many: 119,
		});

		for (const compared of comparedRules.many) {
			expect(compared.biome.length).toBeGreaterThan(0);
			expect(compared.eslint).not.toHaveLength(0);
			expect(compared.flint).not.toHaveLength(0);
			expect(compared.oxlint).not.toHaveLength(0);
			expect(compared.rslint).not.toHaveLength(0);
		}
	});

	it("uses only rules declared by the installed Rslint version", () => {
		const declarations = fs.readFileSync(
			path.join(
				path.dirname(
					fileURLToPath(import.meta.resolve("@rslint/core/package.json")),
				),
				"dist/index.d.ts",
			),
			"utf8",
		);

		for (const { rslint } of comparedRules.many) {
			expect(declarations).toContain(`"${rslint}"?: RuleEntry`);
		}
	});
});
