import path from "node:path";

const TSCONFIG_FILE_NAME_PATTERN = /^tsconfig(?:\..*)?\.json$/u;

export function isStructuralFilePath(
	filePath: string,
	workspaceRoot: string,
	configFileNames: readonly string[],
): boolean {
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

export function normalizeFilePath(filePath: string): string {
	return path.normalize(filePath).replaceAll("\\", "/");
}
