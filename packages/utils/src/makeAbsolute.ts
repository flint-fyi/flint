import * as path from "node:path";

export function makeAbsolute(filePath: string): string {
	return path.isAbsolute(filePath)
		? filePath
		: path.resolve(process.cwd(), filePath);
}
