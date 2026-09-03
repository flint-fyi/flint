import path from "node:path";
import { pathToFileURL } from "node:url";

export function filePathToUri(filePath: string, workspaceRoot: string): string {
	return pathToFileURL(
		path.isAbsolute(filePath)
			? filePath
			: path.resolve(workspaceRoot, filePath),
	).href;
}
