import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { debugForFile } from "debug-for-file";
import { execa } from "execa";

const log = debugForFile(import.meta.url);

export interface Measurement {
	memory: Summary | undefined;
	time: Summary;
}

export interface Summary {
	mean: number;
	stddev: number | undefined;
}

interface HyperfineResults {
	results: {
		summary: {
			memory_peak_resident?: HyperfineSummary;
			time_wall_clock: HyperfineSummary;
		};
	}[];
}

interface HyperfineSummary {
	mean: number;
	// Hyperfine writes null for a single run.
	stddev: null | number;
}

export async function runInHyperfine(
	command: string,
	label: string,
	cwd: string,
	prepare?: string,
): Promise<Measurement> {
	const exportPath = path.join(
		await fs.mkdtemp(path.join(os.tmpdir(), "flint-performance-")),
		"results.json",
	);

	log("Measuring %s in %s...", label, cwd);
	log("\t%s", command);

	// Linters exit with a failure when they report, which every case does.
	const arguments_ = [
		command,
		"--ignore-failure",
		"--show-output",
		"--warmup",
		"1",
		"--metrics",
		"time_wall_clock,memory_peak_resident",
		"--export-json",
		exportPath,
	];
	if (prepare) {
		arguments_.push("--prepare", prepare);
	}

	const result = await execa({ cwd, reject: false })("hyperfine", arguments_);

	if (result.exitCode) {
		throw new Error(`Hyperfine failed for ${label} in ${cwd}.`, {
			cause: new Error(result.stderr),
		});
	}

	const { results } = JSON.parse(
		await fs.readFile(exportPath, "utf8"),
	) as HyperfineResults;
	const summary = results[0]?.summary;
	if (!summary) {
		throw new Error(`Hyperfine reported no results for ${label} in ${cwd}.`);
	}

	log("\t✅");

	return {
		memory:
			summary.memory_peak_resident && toSummary(summary.memory_peak_resident),
		time: toSummary(summary.time_wall_clock),
	};
}

function toSummary({ mean, stddev }: HyperfineSummary): Summary {
	return { mean, stddev: stddev ?? undefined };
}
