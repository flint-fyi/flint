import type { AnyLevelDeep } from "./arrays.ts";
import type { ProcessedConfigDefinition } from "./configs.ts";

export type FilesComputer = (
	config: ProcessedConfigDefinition,
) => FilesValuePrimitive;

export interface FilesGlobObject {
	exclude: AnyLevelDeep<FilesValue>;
	include: AnyLevelDeep<FilesValue>;
}

export interface FilesGlobObjectProcessed {
	exclude: string[];
	include: string[];
}

export type FilesValue = FilesComputer | FilesValuePrimitive;

export type FilesValuePrimitive = FilesGlobObject | string;

export type FilesValues = AnyLevelDeep<FilesValue>;
