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
	const dependencies = Object.fromEntries(
		["@flint.fyi/astro", "@flint.fyi/svelte", "@flint.fyi/vue", "flint"]
			.filter((packageName) => overrides[packageName] !== undefined)
			.map((packageName) => [packageName, overrides[packageName]]),
	);

	return {
		dependencies,
		name: "@flint.fyi/performance-testing-cases",
		pnpm: { overrides },
		private: true,
		type: "module",
	};
}
