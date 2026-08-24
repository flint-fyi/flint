import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import process from "node:process";

import {
	formatRuleCoverage,
	hasRuleCoverageGaps,
	ruleCoverageSources,
	type RuleCoverage,
} from "../src/test-utils/coverage.ts";

interface ExistingIssue {
	number: number;
	title: string;
}

const labels = [
	"area: documentation",
	"package: comparisons",
	"status: accepting prs",
];

const pullRequestNumber = requireEnvironmentVariable("PULL_REQUEST_NUMBER");
const runUrl = requireEnvironmentVariable("RUN_URL");

const existingIssues = JSON.parse(
	gh([
		"issue",
		"list",
		"--json",
		"number,title",
		"--limit",
		"1000",
		"--state",
		"open",
	]),
) as ExistingIssue[];

for (const { collect, linter } of ruleCoverageSources) {
	const coverage = await collect();

	if (!hasRuleCoverageGaps(coverage)) {
		continue;
	}

	const title = `📝 Documentation: Add missing ${linter} rules to rule-data`;
	const body = createIssueBody(linter, coverage);
	const existingIssue = existingIssues.find((issue) => issue.title === title);

	if (existingIssue) {
		gh(
			["issue", "edit", String(existingIssue.number), "--body-file", "-"],
			body,
		);
		console.log(`Updated #${existingIssue.number}: ${title}`);
	} else {
		const url = gh(
			[
				"issue",
				"create",
				"--title",
				title,
				"--body-file",
				"-",
				...labels.flatMap((label) => ["--label", label]),
			],
			body,
		).trim();
		console.log(`Created ${url}: ${title}`);
	}

	if (process.env.GITHUB_STEP_SUMMARY) {
		await fs.appendFile(
			process.env.GITHUB_STEP_SUMMARY,
			`## ${linter}\n\n${formatRuleCoverage(linter, coverage)}\n\n`,
		);
	}
}

function createIssueBody(linter: string, coverage: RuleCoverage): string {
	return [
		"### Documentation Report Checklist",
		"",
		"- [x] I have checked the latest `main` branch of the repository.",
		"- [x] I have [searched for related issues](https://github.com/flint-fyi/flint/issues?q=is%3Aissue) and found none that matched my issue.",
		"",
		"### Overview",
		"",
		`Renovate PR #${pullRequestNumber} updates a dependency whose ${linter} rules no longer match \`packages/rule-data/src/data.json\`.`,
		"`packages/rule-data/src/data.test.ts` fails on that PR until the data is synced.",
		"",
		formatRuleCoverage(linter, coverage),
		"",
		"### Additional Info",
		"",
		`Filed by the [Rule Data Renovate workflow](${runUrl}).`,
		`This issue is updated in place while Renovate PRs keep reporting ${linter} gaps, so the lists above reflect the latest failing run.`,
		"",
		"To resolve:",
		"",
		"1. Add each missing rule to `packages/rule-data/src/data.json`, and remove stale or duplicate references.",
		"2. Run `pnpm --filter=rule-data sort-data`.",
		"3. Push to the Renovate branch, or open a PR that bumps the dependency and closes this issue.",
	].join("\n");
}

function gh(args: string[], input?: string): string {
	return execFileSync("gh", args, { encoding: "utf8", input });
}

function requireEnvironmentVariable(name: string): string {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}
