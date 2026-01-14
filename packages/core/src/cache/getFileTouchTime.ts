import * as fsSync from "node:fs";

export function getFileTouchTime(filePath: string) {
	// TODO: Speed this up with an in-memory file system
	// https://github.com/flint-fyi/flint/issues/73
	return fsSync.statSync(filePath).mtimeMs;
}
