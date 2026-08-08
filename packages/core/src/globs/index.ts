// flint-disable-next-line ts/typeImports -- false positive https://github.com/flint-fyi/flint/issues/3182
import { all } from "./all.ts";

export interface Globs {
	/**
	 * Selects all files included (and not excluded) by past config definitions.
	 */
	all: typeof all;
}

export const globs: Globs = {
	/**
	 * Selects all files included (and not excluded) by past config definitions.
	 */
	all,
};
