import path from "node:path";

import { configFileNameCandidates } from "@flint.fyi/core";
import { normalizePath } from "@flint.fyi/utils";

export function isStructuralFilePath(
	filePath: string,
	workspaceRoot: string,
): boolean {
	const fileName = path.basename(filePath);

	return (
		configFileNameCandidates.includes(
			normalizePath(path.relative(workspaceRoot, filePath)),
		) ||
		fileName === "package.json" ||
		/^tsconfig(?:\..+)?\.json$/u.test(fileName)
	);
}
