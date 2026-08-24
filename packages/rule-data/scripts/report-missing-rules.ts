import process from "node:process";

import {
	collectRuleCoverageReports,
	formatRuleCoverage,
	hasRuleCoverageGaps,
} from "../src/test-utils/coverage.ts";

let reportedGaps = false;

for (const { coverage, linter } of await collectRuleCoverageReports()) {
	if (!hasRuleCoverageGaps(coverage)) {
		continue;
	}

	reportedGaps = true;
	console.log(`## ${linter}\n\n${formatRuleCoverage(linter, coverage)}\n`);
}

if (reportedGaps) {
	process.exitCode = 1;
} else {
	console.log("data.json covers all rules from every compared linter.");
}
