import { styleText } from "node:util";

import type { PresenterInitializeContext } from "../types.ts";

export function* presentHeader({
	configFileName,
	ignoreCache,
	runMode,
}: PresenterInitializeContext): Generator<string, void, void> {
	const configFileNameText = styleText(["cyan", "bold"], configFileName);
	yield styleText(
		"gray",
		runMode === "single-run"
			? `Linting with ${configFileNameText}...`
			: `Running with ${configFileNameText} in --watch mode (start time: ${Date.now()})...`,
	);

	if (ignoreCache) {
		yield styleText("gray", `--cache-ignore specified, ignoring the cache...`);
	}
}
