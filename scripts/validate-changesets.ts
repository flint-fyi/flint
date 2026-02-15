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
			const summary = parts[parts.length - 1]?.trim();

			if (!summary) {
				console.error(
					`\x1b[31m❌ Error in ${basename(filePath)}:\x1b[0m Summary is empty.`,
				);
				return false;
			}

			if (CONVENTIONAL_PATTERN.test(summary)) {
				const found = summary.split("\n")[0];
				const recommended = found.replace(CONVENTIONAL_PATTERN, "").trim();
				console.error(`\x1b[31m❌ Error in ${basename(filePath)}:\x1b[0m`);
				console.error(
					`   Changesets should be human-readable. Do not use conventional commit prefixes.`,
				);
				console.error(`   Found: "${found}"`);
				console.error(`   Recommended: "${recommended}"\n`);
				return false;
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error(`\x1b[31mFailed to process ${filePath}:\x1b[0m ${message}`);
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

if (stagedFiles.length > 0) {
	void validateChangesets(stagedFiles);
}
