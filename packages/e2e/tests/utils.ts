import { normalizePath } from "@flint.fyi/utils";
import { execa } from "execa";

declare global {
	// TODO[typescript>=6.0]: Remove this declaration.
	// https://github.com/microsoft/TypeScript/pull/63046
	export interface RegExpConstructor {
		/**
		 * Escapes any RegExp syntax characters in the input string, returning a
		 * new string that can be safely interpolated into a RegExp as a literal
		 * string to match.
		 * @example
		 * ```ts
		 * const regExp = new RegExp(RegExp.escape("foo.bar"));
		 * regExp.test("foo.bar"); // true
		 * regExp.test("foo!bar"); // false
		 * ```
		 */
		escape(string: string): string;
	}
}

/**
 * Normalizes CLI output for snapshot testing: converts backslashes to forward
 * slashes and replaces the given cwd with `&lt;cwd&gt;` so snapshots are portable.
 */
export function normalizeOutput(stdout: string, cwd: string): string {
	const normalizedCwd = normalizePath(cwd);

	return stdout
		.replace(/\\/g, "/")
		.replace(new RegExp(RegExp.escape(normalizedCwd), "gi"), "<cwd>")
		.replace(/Finished in \S+/g, "Finished in <time>");
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
