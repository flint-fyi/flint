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
	// Install every packed workspace artifact as a direct `file:` dependency.
	// pnpm no longer reads `pnpm.overrides` from a package.json (only from
	// pnpm-workspace.yaml), so relying on overrides to redirect transitive
	// `@flint.fyi/*` ranges to the local tarballs fails with registry 404s.
	// Listing them directly lets pnpm satisfy those transitive `^0.x` ranges
	// from the tarball versions instead.
	const dependencies = { ...overrides };

	return {
		dependencies,
		name: "@flint.fyi/performance-testing-cases",
		private: true,
		type: "module",
	};
}
