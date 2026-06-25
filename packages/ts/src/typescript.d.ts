import "typescript";

declare module "typescript" {
	interface Program {
		/**
		 * Maps from a SourceFile's `.path` to the name of the package it was imported with.
		 */
		readonly sourceFileToPackageName: ReadonlyMap<Path, string>;
	}

	interface SourceFile extends Declaration, LocalsContainer {
		path: Path;
	}
}
