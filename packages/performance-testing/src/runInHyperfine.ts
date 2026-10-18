import fs from "node:fs/promises";
import path from "node:path";

import { debugForFile } from "debug-for-file";
import { execa } from "execa";

import {
	summarizeHyperfine,
	type HyperfineSummary,
} from "./summarizeHyperfine.ts";
import { testCasesPath } from "./testCases.ts";

const log = debugForFile(import.meta.url);

export async function runInHyperfine(
	command: string,
	label: string,
	slug: string,
): Promise<HyperfineSummary> {
	const cwd = path.join(testCasesPath, slug);
	const exportPath = path.resolve(cwd, `${label}.hyperfine.json`);

	log("Measuring %s in %s...", label, cwd);
	log("\t%s", command);

	await execa({
		cwd,
	})("hyperfine", [
		command,
		"--shell=none",
		"--metrics",
		"time_wall_clock:ms,memory_peak_resident:MiB",
		"--export-json",
		exportPath,
		"--ignore-failure",
		"--show-output",
		"--warmup",
		"1",
	]);

	log("\t✅ %s", exportPath);
	return summarizeHyperfine(await fs.readFile(exportPath, "utf8"));
}
