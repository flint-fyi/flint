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
 *
 * The Node.js compile cache is disabled because CI always starts with an empty
 * cache, and concurrent flint processes writing it are slow enough on Windows
 * to time tests out.
 */
export async function runFlint(
	cwd: string,
	args: string[] = [],
): Promise<{ exitCode: number | undefined; stdout: string }> {
	const { exitCode, stdout } = await execa({
		cwd,
		env: {
			FORCE_COLOR: "1",
			GITHUB_ACTIONS: undefined,
			NODE_DISABLE_COMPILE_CACHE: "1",
		},
		reject: false,
	})`flint ${args}`;

	return { exitCode, stdout };
}
