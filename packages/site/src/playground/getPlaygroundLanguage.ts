import type { PlaygroundLanguage } from "./types.ts";

const languagesByExtension = new Map<string, PlaygroundLanguage>([
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

export const playgroundExtensions = [...languagesByExtension.keys()];

export function getFileExtension(fileName: string): string | undefined {
	const extensionIndex = fileName.lastIndexOf(".");

	return extensionIndex > 0 ? fileName.slice(extensionIndex) : undefined;
}

export function getPlaygroundLanguage(
	fileName: string,
): PlaygroundLanguage | undefined {
	const extension = getFileExtension(fileName);

	return extension === undefined
		? undefined
		: languagesByExtension.get(extension);
}
