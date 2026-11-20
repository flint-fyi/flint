import type { PlaygroundParser } from "./types.ts";

const parsersByExtension = new Map<string, PlaygroundParser>([
	[".cjs", "typescript"],
	[".cts", "typescript"],
	[".js", "typescript"],
	[".json", "json"],
	[".jsx", "typescript"],
	[".mjs", "typescript"],
	[".mts", "typescript"],
	[".ts", "typescript"],
	[".tsx", "typescript"],
]);

export const playgroundExtensions = [...parsersByExtension.keys()];

export function getFileExtension(fileName: string): string | undefined {
	const extensionIndex = fileName.lastIndexOf(".");

	return extensionIndex > 0 ? fileName.slice(extensionIndex) : undefined;
}

export function getPlaygroundParser(
	fileName: string,
): PlaygroundParser | undefined {
	const extension = getFileExtension(fileName);

	return extension === undefined
		? undefined
		: parsersByExtension.get(extension);
}
