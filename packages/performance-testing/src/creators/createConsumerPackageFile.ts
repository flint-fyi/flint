import path from "node:path";

export function createConsumerPackageFile(
	artifacts: Map<string, string>,
	testCasesPath: string,
): object {
	const overrides = Object.fromEntries(
		[...artifacts].map(([packageName, artifactPath]) => [
			packageName,
			`file:${path.relative(testCasesPath, artifactPath).split(path.sep).join("/")}`,
		]),
	);

	return {
		dependencies: { flint: overrides.flint },
		name: "@flint.fyi/performance-testing-cases",
		pnpm: { overrides },
		private: true,
		type: "module",
	};
}
