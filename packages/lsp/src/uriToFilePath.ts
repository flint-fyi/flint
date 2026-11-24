import { fileURLToPath } from "node:url";

import { normalizePath } from "@flint.fyi/utils";

export function uriToFilePath(uri: string): string {
	return normalizePath(fileURLToPath(uri));
}
