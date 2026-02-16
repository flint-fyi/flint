import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { styleText } from "node:util";

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
					`${styleText("red", `❌ Error in ${basename(filePath)}:`)} Summary is empty.`,
				);
				return false;
			}

			if (CONVENTIONAL_PATTERN.test(summary)) {
				const found = summary.split("\n")[0];
				const recommended = found?.replace(CONVENTIONAL_PATTERN, "").trim();
				console.error(styleText("red", `❌ Error in ${basename(filePath)}:`));
				console.error(
					`   Changesets should be human-readable. Do not use conventional commit prefixes.`,
				);
				console.error(`   Found: "${found}"`);
				console.error(`   Recommended: "${recommended}"\n`);
				return false;
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(
				`${styleText("red", `Failed to process ${filePath}:`)} ${message}`,
			);
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
