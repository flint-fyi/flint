import "typescript";

declare module "typescript" {
	// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/utilities.ts#L9780-L9784
	interface FileSystemEntries {
		readonly directories: readonly string[];
		readonly files: readonly string[];
	}

	// https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/utilities.ts#L9826
	function matchFiles(
		path: string,
		extensions: readonly string[] | undefined,
		excludes: readonly string[] | undefined,
		includes: readonly string[] | undefined,
		useCaseSensitiveFileNames: boolean,
		currentDirectory: string,
		depth: number | undefined,
		getFileSystemEntries: (path: string) => FileSystemEntries,
		realpath: (path: string) => string,
	): string[];
}
