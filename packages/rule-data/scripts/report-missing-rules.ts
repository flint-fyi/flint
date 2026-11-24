import fs from "node:fs/promises";
import process from "node:process";

import {
	collectRuleCoverageReports,
	formatRuleCoverage,
	hasRuleCoverageGaps,
} from "../src/test-utils/coverage.ts";

const summarySections: string[] = [];

for (const { coverage, linter } of await collectRuleCoverageReports()) {
	if (!hasRuleCoverageGaps(coverage)) {
		continue;
	}

	summarySections.push(
		`## ${linter}\n\n${formatRuleCoverage(linter, coverage)}`,
	);
}

const summary = summarySections.length
	? `Rule coverage gaps are tracked in issues after merging to main; they do not block PRs.\n\n${summarySections.join("\n\n")}\n`
	: "data.json covers all rules from every compared linter.\n";

console.log(summary);

if (process.env.GITHUB_STEP_SUMMARY) {
	await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
}
