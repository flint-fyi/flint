import { describe, expect, it } from "vitest";

import { compareRuleCoverage, formatRuleCoverage } from "./coverage.ts";

describe(compareRuleCoverage, () => {
	it("reports nothing when the covered names match the available rules", () => {
		expect(
			compareRuleCoverage(
				[
					{ name: "a", url: undefined },
					{ name: "b", url: "https://example.com/b" },
				],
				["b", "a"],
			),
		).toEqual({ duplicates: [], missing: [], stale: [] });
	});

	it("reports duplicate covered names", () => {
		expect(
			compareRuleCoverage([{ name: "a", url: undefined }], ["a", "a"]),
		).toEqual({ duplicates: ["a"], missing: [], stale: [] });
	});

	it("allows duplicate covered names when mappings are many-to-one", () => {
		expect(
			compareRuleCoverage([{ name: "a", url: undefined }], ["a", "a"], {
				allowDuplicates: true,
			}),
		).toEqual({ duplicates: [], missing: [], stale: [] });
	});

	it("reports available rules that are not covered, sorted by name", () => {
		expect(
			compareRuleCoverage(
				[
					{ name: "c", url: "https://example.com/c" },
					{ name: "a", url: undefined },
					{ name: "b", url: undefined },
				],
				["b"],
			),
		).toEqual({
			duplicates: [],
			missing: [
				{ name: "a", url: undefined },
				{ name: "c", url: "https://example.com/c" },
			],
			stale: [],
		});
	});

	it("reports covered names that are no longer available, sorted", () => {
		expect(
			compareRuleCoverage([{ name: "a", url: undefined }], ["z", "a", "y"]),
		).toEqual({ duplicates: [], missing: [], stale: ["y", "z"] });
	});
});

describe(formatRuleCoverage, () => {
	it("renders missing rules as a checklist with optional urls", () => {
		expect(
			formatRuleCoverage("unicorn", {
				duplicates: [],
				missing: [
					{ name: "unicorn/a", url: "https://example.com/a" },
					{ name: "unicorn/b", url: undefined },
				],
				stale: [],
			}),
		).toBe(
			[
				"**Missing from data.json (2):**",
				"",
				"- [ ] [`unicorn/a`](https://example.com/a)",
				"- [ ] `unicorn/b`",
			].join("\n"),
		);
	});

	it("renders stale rules after missing rules", () => {
		expect(
			formatRuleCoverage("unicorn", {
				duplicates: [],
				missing: [{ name: "unicorn/a", url: undefined }],
				stale: ["unicorn/z"],
			}),
		).toBe(
			[
				"**Missing from data.json (1):**",
				"",
				"- [ ] `unicorn/a`",
				"",
				"**In data.json but no longer provided by unicorn (1):**",
				"",
				"- `unicorn/z`",
			].join("\n"),
		);
	});

	it("renders duplicate rules after stale rules", () => {
		expect(
			formatRuleCoverage("Oxlint", {
				duplicates: ["typescript/no-explicit-any"],
				missing: [],
				stale: ["typescript/no-var-requires"],
			}),
		).toBe(
			[
				"**In data.json but no longer provided by Oxlint (1):**",
				"",
				"- `typescript/no-var-requires`",
				"",
				"**Duplicated in data.json (1):**",
				"",
				"- `typescript/no-explicit-any`",
			].join("\n"),
		);
	});
});
