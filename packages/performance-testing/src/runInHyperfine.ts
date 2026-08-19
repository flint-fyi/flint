import path from "node:path";

import { debugForFile } from "debug-for-file";
import { execa } from "execa";

import { testCasesPath } from "./testCases.ts";

const log = debugForFile(import.meta.filename);

export async function runInHyperfine(
	command: string,
	label: string,
	slug: string,
): Promise<string> {
	const cwd = path.join(testCasesPath, slug);

	log("Measuring %s in %s...", label, cwd);
	log("\t%s", command);

	const result = await execa({
		cwd,
		reject: false,
	})("hyperfine", [
		command,
		"--ignore-failure",
		"--show-output",
		"--warmup",
		"1",
	]);

	if (result.exitCode) {
		log(result.stderr);
		log({ result });
	} else {
		log("\t✅");
	}

	return (
		/[0-9.]+\s+\S+\s+±\s+[0-9.]+\s+\S+/.exec(result.stdout)?.[0] ??
		result.stdout
	);
}
