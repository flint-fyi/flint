import chalk from "chalk";

import type { PresenterInitializeContext } from "../types.ts";

export function* presentHeader({
	configFileName,
	ignoreCache,
	runMode,
}: PresenterInitializeContext) {
	const configFileNameText = chalk.cyan(chalk.bold(configFileName));
	yield chalk.gray(
		runMode === "single-run"
			? `Linting with ${configFileNameText}...`
			: `Running with ${configFileNameText} in --watch mode (start time: ${Date.now()})...`,
	);

	if (ignoreCache) {
		yield chalk.gray(`--cache-ignore specified, ignoring the cache...`);
	}
}
