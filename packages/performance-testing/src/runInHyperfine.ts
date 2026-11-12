import { debugForFile } from "debug-for-file";
import { execa } from "execa";

import {
	summarizeHyperfine,
	type HyperfineSummary,
} from "./summarizeHyperfine.ts";

const log = debugForFile(import.meta.url);

export async function runInHyperfine(
	command: string,
	label: string,
	cwd: string,
	prepare?: string,
): Promise<HyperfineSummary> {
	log("Measuring %s in %s...", label, cwd);
	log("\t%s", command);

	const { stdout } = await execa({
		cwd,
	})("hyperfine", [
		command,
		"--shell=none",
		"--metrics",
		"time_wall_clock:ms,memory_peak_resident:MiB",
		"--export-json",
		"-",
		"--style=none",
		"--ignore-failure",
		"--warmup",
		"1",
		// Hyperfine runs preparation commands in a shell even with --shell=none.
		...(prepare ? ["--prepare", prepare] : []),
	]);

	log("\t✅ %s", stdout);
	return summarizeHyperfine(stdout);
}
