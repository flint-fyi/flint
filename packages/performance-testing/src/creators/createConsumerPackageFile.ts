import path from "node:path";

export function createArtifactSpecifiers(
	artifacts: Map<string, string>,
	testCasesPath: string,
): Record<string, string> {
	return Object.fromEntries(
		[...artifacts].map(([packageName, artifactPath]) => [
			packageName,
			`file:${path.relative(testCasesPath, artifactPath).split(path.sep).join("/")}`,
		]),
	);
}

export function createConsumerPackageFile(
	artifactSpecifiers: Record<string, string>,
): object {
	return {
		dependencies: artifactSpecifiers,
		name: "@flint.fyi/performance-testing-cases",
		private: true,
		type: "module",
	};
}
