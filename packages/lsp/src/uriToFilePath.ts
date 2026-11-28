import { fileURLToPath } from "node:url";

import { normalizePath } from "@flint.fyi/utils";

export function uriToFilePath(uri: string): string | undefined {
	try {
		return normalizePath(fileURLToPath(uri));
	} catch {
		return undefined;
	}
}
