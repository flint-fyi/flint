export const gitVcs = "/.git";
export const jjVcs = "/.jj";
export const vcsDirectories = [gitVcs, jjVcs];
export const nodeModulesDir = "/node_modules";
export const nodeModulesCache = "/node_modules/.cache";
export const commonlyIgnoredPaths = [...vcsDirectories, nodeModulesDir];
