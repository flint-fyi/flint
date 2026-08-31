export const gitVcs = "/.git";
export const jjVcs = "/.jj";
export const vcsDirectories: string[] = [gitVcs, jjVcs];
export const nodeModulesDir = "/node_modules";
export const nodeModulesCache = "/node_modules/.cache";
export const commonlyIgnoredPaths: string[] = [
	...vcsDirectories,
	nodeModulesDir,
];
export const commonlyIgnoredGlobs: string[] = commonlyIgnoredPaths.map(
	(dir) => `**${dir}`,
);
