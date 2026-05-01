export const gitVcs = "/.git";
export const jjVcs = "/.jj";
export const vcsDirs = [gitVcs, jjVcs];
export const nodeModulesDir = "/node_modules";
export const nodeModulesCache = "/node_modules/.cache";
export const commonlyIgnoredPaths = [...vcsDirs, nodeModulesDir];
