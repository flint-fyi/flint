import { execa } from "execa";

import { normalizePath } from "@flint.fyi/utils";

/**
 * Normalizes CLI output for snapshot testing: converts backslashes to forward
 * slashes and replaces the given cwd with `&lt;cwd&gt;` so snapshots are portable.
 */
export function normalizeOutput(stdout: string, cwd: string): string {
	const normalizedCwd = normalizePath(cwd);

	return stdout
		.replaceAll("\\", "/")
		.replaceAll(new RegExp(RegExp.escape(normalizedCwd), "gi"), "<cwd>")
		.replaceAll(/Finished in \S+/g, "Finished in <time>");
}

/**
 * Runs the flint CLI with color output enabled.
 *
 * `GITHUB_ACTIONS` is cleared so the default presenter stays deterministic:
 * otherwise CI would auto-select the `github` presenter and change the output.
 */
export function runFlint(cwd: string, args: string[] = []) {
	return execa({
		cwd,
		env: { FORCE_COLOR: "1", GITHUB_ACTIONS: undefined },
		reject: false,
	})`flint ${args}`;
}
