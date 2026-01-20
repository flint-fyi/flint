import type { AnyLevelDeep } from "./arrays.ts";
import type { ProcessedConfigDefinition } from "./configs.ts";
import type { Plugin } from "./plugins.ts";

/**
 * Computes files based on previous config definition entries.
 * @remarks
 * This is necessary for selectors such as the core `all` glob that for files
 * previously included (and not excluded) by past config definition entries.
 */
export type FilesComputer = (
	/**
	 * In-progress processed config definitions up to this point.
	 */
	config: ProcessedConfigDefinition,
) => FilesValuePrimitive;

/**
 * Selects files to include, exclude, or both.
 */
export interface FilesGlobObject {
	/**
	 * Any number of glob(s) for files to exclude from the `include` definition.
	 */
	exclude: AnyLevelDeep<FilesValue>;

	/**
	 * Any number of glob(s) for files to add to what the config selects.
	 */
	include: AnyLevelDeep<FilesValue>;
}

/**
 * Selects files to exclude or include in a {@link Plugin} `rules` config.
 * @see {@link https://flint.fyi/glossary#files|flint.fyi/glossary#files}
 */
export type FilesValue = FilesComputer | FilesValuePrimitive;

export type FilesValuePrimitive = FilesGlobObject | string;

export type FilesValues = AnyLevelDeep<FilesValue>;
