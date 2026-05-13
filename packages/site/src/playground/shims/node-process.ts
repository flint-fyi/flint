/**
 * Minimal browser shim for `node:process`. Only the subset Flint reaches at
 * runtime is implemented.
 */

export const platform: NodeJS.Platform = "linux";
export const env: NodeJS.ProcessEnv = {};
export const argv: string[] = [];

export function cwd(): string {
	return "/playground";
}

const proc = {
	argv,
	cwd,
	env,
	platform,
};

export default proc;
