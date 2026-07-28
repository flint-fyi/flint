import path from "node:path";

import type {
	FileResults,
	LintSession,
	LintSessionLintOptions,
} from "@flint.fyi/core";

export interface ChangedLintBatch {
	changedResults: Map<string, FileResults>;
	dependentFilePaths: Set<string>;
}

export type IncrementalLintSession = Pick<
	LintSession,
	"getTransitiveDependentsOf" | "lintFiles"
>;

const TSCONFIG_FILE_NAME_PATTERN = /^tsconfig(?:\..*)?\.json$/u;

export function isStructuralFilePath(
	filePath: string,
	workspaceRoot: string,
	configFileNames: readonly string[],
) {
	const relativePath = normalizeFilePath(
		path.relative(workspaceRoot, filePath),
	);
	if (configFileNames.includes(relativePath)) {
		return true;
	}

	const fileName = path.basename(filePath);
	return (
		fileName === "package.json" || TSCONFIG_FILE_NAME_PATTERN.test(fileName)
	);
}

export async function lintChangedFiles(
	session: IncrementalLintSession,
	filePaths: Set<string>,
	options?: LintSessionLintOptions,
): Promise<ChangedLintBatch> {
	const changedResults = await session.lintFiles(filePaths, options);
	const dependentFilePaths = session.getTransitiveDependentsOf(filePaths);

	for (const filePath of changedResults.keys()) {
		dependentFilePaths.delete(filePath);
	}

	return { changedResults, dependentFilePaths };
}

export function normalizeFilePath(filePath: string) {
	return path.normalize(filePath).replaceAll("\\", "/");
}
