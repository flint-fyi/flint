import "typescript";

declare module "typescript" {
	interface Program {
		/**
		 * Maps from a SourceFile's `.path` to the name of the package it was imported with.
		 * @see https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/types.ts#L4889
		 */
		readonly sourceFileToPackageName: ReadonlyMap<Path, string>;

		/**
		 * Whether the Program's CompilerHost treats file names as case-sensitive.
		 * @see https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/types.ts#L4919
		 */
		useCaseSensitiveFileNames(): boolean;
	}

	interface SourceFile extends Declaration, LocalsContainer {
		path: Path;
	}
}
