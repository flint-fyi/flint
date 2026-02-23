import { execa } from "execa";

/**
 * Normalizes CLI output for snapshot testing: converts backslashes to forward
 * slashes and replaces the given cwd with `&lt;cwd&gt;` so snapshots are portable.
 */
export function normalizeOutput(stdout: string, cwd: string): string {
	const normalizedCwd = cwd.replace(/\\/g, "/");
	return stdout.replace(/\\/g, "/").split(normalizedCwd).join("<cwd>");
}

/**
 * Runs the flint CLI with color output enabled.
 */
export function runFlint(cwd: string, args: string[] = []) {
	return execa({
		cwd,
		env: { FORCE_COLOR: "1" },
		reject: false,
	})`npx flint ${args}`;
}
