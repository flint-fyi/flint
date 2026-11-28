import { pathToFileURL } from "node:url";

export function filePathToUri(filePath: string): string {
	return pathToFileURL(filePath).href;
}
