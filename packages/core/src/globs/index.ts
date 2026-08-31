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
