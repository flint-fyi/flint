import path from "node:path";

export function createConsumerFiles(
	artifacts: Map<string, string>,
	testCasesPath: string,
): { packageFile: object; workspaceFile: object } {
	const overrides = Object.fromEntries(
		[...artifacts].map(([packageName, artifactPath]) => [
			packageName,
			`file:${path.relative(testCasesPath, artifactPath).split(path.sep).join("/")}`,
		]),
	);

	return {
		packageFile: {
			dependencies: { flint: overrides.flint },
			name: "@flint.fyi/performance-testing-cases",
			private: true,
			type: "module",
		},
		workspaceFile: { overrides },
	};
}
