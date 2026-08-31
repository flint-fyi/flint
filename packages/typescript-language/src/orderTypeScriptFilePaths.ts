import { resolve } from "pathe";

import type { LinterHost } from "@flint.fyi/core";
import { nullThrows, pathKey } from "@flint.fyi/utils";

import { createTypeScriptProjectSession } from "./createTypeScriptProjectSession.ts";

export function orderTypeScriptFilePaths(
	filePaths: readonly string[],
	host: LinterHost,
): string[] {
	if (filePaths.length < 2) {
		return [...filePaths];
	}

	using session = createTypeScriptProjectSession(host);
	const caseSensitiveFileSystem = host.isCaseSensitiveFS();
	const currentDirectory = host.getCurrentDirectory();
	const absolutePaths = new Map(
		filePaths.map((filePath) => [
			filePath,
			resolve(currentDirectory, filePath),
		]),
	);
	const snapshot = session.update({ openFiles: [...absolutePaths.values()] });
	const projectRanks = new Map(
		snapshot
			.getProjects()
			.map((project, index) => [project.configFileName, index]),
	);

	return [...filePaths].sort((left, right) => {
		const leftAbsolute = nullThrows(
			absolutePaths.get(left),
			`Expected an absolute path for ${left}`,
		);
		const rightAbsolute = nullThrows(
			absolutePaths.get(right),
			`Expected an absolute path for ${right}`,
		);
		const leftProject = snapshot.getDefaultProjectForFile(leftAbsolute);
		const rightProject = snapshot.getDefaultProjectForFile(rightAbsolute);
		const leftRank =
			projectRanks.get(leftProject?.configFileName ?? "") ??
			Number.MAX_SAFE_INTEGER;
		const rightRank =
			projectRanks.get(rightProject?.configFileName ?? "") ??
			Number.MAX_SAFE_INTEGER;

		return (
			leftRank - rightRank ||
			pathKey(leftAbsolute, caseSensitiveFileSystem).localeCompare(
				pathKey(rightAbsolute, caseSensitiveFileSystem),
			)
		);
	});
}
