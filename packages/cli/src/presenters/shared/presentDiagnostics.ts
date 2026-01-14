import type { FileResults } from "@flint.fyi/core";
import chalk from "chalk";

import { pluralize } from "../pluralize.ts";

export function* presentDiagnostics(filesResults: Map<string, FileResults>) {
	const diagnostics = Array.from(filesResults.values()).flatMap(
		(fileResults) => fileResults.diagnostics,
	);
	if (!diagnostics.length) {
		return;
	}

	yield "\n";
	yield chalk.yellow`⚠️  Additionally found ${pluralize(diagnostics.length, "diagnostic")}:`;
	yield "\n\n";

	for (const diagnostic of diagnostics) {
		yield diagnostic.text;
		yield "\n";
	}

	yield "\n";
}
