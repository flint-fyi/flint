import { readFile } from "node:fs/promises";
import { basename } from "node:path";

/**
 * Patterns that indicate conventional commit formatting.
 */
const CONVENTIONAL_PATTERN =
	/^(?:feat|fix|chore|docs|style|refactor|perf|test|build|ci)(?:\(.*\))?!?: /i;

async function validateChangesets(files: string[]): Promise<void> {
	const tasks = files.map(async (filePath): Promise<boolean> => {
		try {
			const content = await readFile(filePath, "utf-8");

			// Changeset format:
			// ---
			// "package-name": patch
			// ---
			// Human readable summary <--- We want this part
			const parts = content.split("---");
			const summary = parts.at(-1)?.trim();

			if (!summary) {
				console.error(
					`\x1B[31M❌ Error in ${basename(filePath)}:\x1B[0m Summary is empty.`,
				);
				return false;
			}

			if (CONVENTIONAL_PATTERN.test(summary)) {
				const found = summary.split("\n")[0];
				const recommended = found?.replace(CONVENTIONAL_PATTERN, "").trim();
				console.error(`\x1B[31M❌ Error in ${basename(filePath)}:\x1B[0M`);
				console.error(
					`   Changesets should be human-readable. Do not use conventional commit prefixes.`,
				);
				console.error(`   Found: "${found}"`);
				console.error(`   Recommended: "${recommended}"\n`);
				return false;
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`\x1B[31MFailed to process ${filePath}:\x1B[0M ${message}`);
			return false;
		}
		return true;
	});

	const results = await Promise.all(tasks);

	if (results.includes(false)) {
		process.exitCode = 1;
	}
}

// lint-staged passes files as arguments
const stagedFiles = process.argv.slice(2);

if (stagedFiles.length) {
	await validateChangesets(stagedFiles);
}
