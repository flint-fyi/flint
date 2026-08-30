import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import process from "node:process";

import {
	collectRuleCoverageReports,
	formatRuleCoverage,
	hasRuleCoverageGaps,
	type RuleCoverage,
} from "../src/test-utils/coverage.ts";

interface ExistingIssue {
	body: string;
	number: number;
	title: string;
}

const labels = [
	"area: documentation",
	"package: rule-data",
	"status: accepting prs",
];

const pullRequestNumber = requireEnvironmentVariable("PULL_REQUEST_NUMBER");
const runUrl = requireEnvironmentVariable("RUN_URL");

const existingIssues = JSON.parse(
	gh([
		"issue",
		"list",
		"--json",
		"number,title,body",
		"--limit",
		"1000",
		"--state",
		"open",
	]),
) as ExistingIssue[];

const summarySections: string[] = [];

for (const { coverage, linter } of await collectRuleCoverageReports()) {
	if (!hasRuleCoverageGaps(coverage)) {
		continue;
	}

	const title = `📝 Documentation: Add missing ${linter} rules to rule-data`;
	const body = createIssueBody(linter, coverage);
	const existingIssue = existingIssues.find(
		(issue) =>
			issue.body.includes(createIssueBodyLinterComment(linter)) ||
			issue.title === title,
	);

	if (existingIssue) {
		// If we already have an issue that covers the exact same coverage delta, we don't need to update it
		if (existingIssue.body.includes(createIssueRulesDeltaComment(coverage))) {
			console.log(
				`${linter}: Issue #${existingIssue.number} already exists, and is up to date.  Nothing to do...`,
			);
			continue;
		}
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

	summarySections.push(
		`## ${linter}\n\n${formatRuleCoverage(linter, coverage)}`,
	);
}

const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (summaryPath && summarySections.length) {
	await fs.appendFile(summaryPath, `${summarySections.join("\n\n")}\n`);
}

function createIssueBody(linter: string, coverage: RuleCoverage): string {
	return [
		createIssueBodyLinterComment(linter),
		createIssueRulesDeltaComment(coverage),
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
		"1. Add each missing rule to `packages/rule-data/src/data.json`, and remove stale references.",
		"2. For rules that shouldn't be skipped, file a [new rule issue](https://github.com/flint-fyi/flint/issues/new?template=03-new-rule.yaml) to track the Flint equivalent.",
		"3. Run `pnpm --filter=rule-data sort-data`.",
		"4. Push to the Renovate branch, or open a PR that bumps the dependency and closes this issue.",
	].join("\n");
}

function createIssueBodyLinterComment(linter: string): string {
	return `<!-- out-of-sync-data-${linter} -->`;
}

function createIssueRulesDeltaComment(coverage: RuleCoverage): string {
	return `<!-- {missing:[${coverage.missing.map((rule) => rule.name).join(",")}], stale: [${coverage.stale.join(",")}]} -->`;
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
