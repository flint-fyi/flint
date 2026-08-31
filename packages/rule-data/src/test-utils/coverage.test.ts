import { describe, expect, it } from "vitest";

import {
	collectRuleCoverageReports,
	compareRuleCoverage,
	formatRuleCoverage,
	hasRuleCoverageGaps,
	ruleCoverageSources,
} from "./coverage.ts";

describe(collectRuleCoverageReports, () => {
	it("collects one report per source, preserving source order", async () => {
		const reports = await collectRuleCoverageReports();

		expect(reports.map(({ linter }) => linter)).toEqual(
			ruleCoverageSources.map(({ linter }) => linter),
		);
	});
});

describe(compareRuleCoverage, () => {
	it("reports nothing when the covered names match the available rules", () => {
		expect(
			compareRuleCoverage(
				[
					{ name: "a", url: undefined },
					{ name: "b", url: "https://example.com/b" },
				],
				["b", "a", "a"],
			),
		).toEqual({ missing: [], stale: [] });
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
		).toEqual({ missing: [], stale: ["y", "z"] });
	});
});

describe(formatRuleCoverage, () => {
	it("renders missing rules as a checklist with optional urls", () => {
		expect(
			formatRuleCoverage("unicorn", {
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

	it("renders stale rules as a checklist after missing rules", () => {
		expect(
			formatRuleCoverage("unicorn", {
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
				"- [ ] `unicorn/z`",
			].join("\n"),
		);
	});

	it("renders only stale rules when no rules are missing", () => {
		expect(
			formatRuleCoverage("unicorn", {
				missing: [],
				stale: ["unicorn/z"],
			}),
		).toBe(
			[
				"**In data.json but no longer provided by unicorn (1):**",
				"",
				"- [ ] `unicorn/z`",
			].join("\n"),
		);
	});
});

describe(hasRuleCoverageGaps, () => {
	it("returns false when no rules are missing or stale", () => {
		expect(hasRuleCoverageGaps({ missing: [], stale: [] })).toBe(false);
	});

	it("returns true when rules are missing", () => {
		expect(
			hasRuleCoverageGaps({
				missing: [{ name: "a", url: undefined }],
				stale: [],
			}),
		).toBe(true);
	});

	it("returns true when rules are stale", () => {
		expect(hasRuleCoverageGaps({ missing: [], stale: ["a"] })).toBe(true);
	});
});
