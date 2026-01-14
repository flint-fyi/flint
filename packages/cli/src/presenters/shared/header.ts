import { cacheFilePath } from "@flint.fyi/core";
import chalk from "chalk";
import fs from "node:fs";

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

	if (!ignoreCache) {
		return;
	}

	const cacheExists = fs.existsSync(cacheFilePath);

	yield chalk.gray(
		cacheExists
			? `--cache-ignore: ignoring cache file at ${cacheFilePath}`
			: `--cache-ignore specified but no cache exists at ${cacheFilePath}`,
	);
}
