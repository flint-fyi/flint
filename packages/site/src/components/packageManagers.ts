export const packageManagers = ["npm", "bun", "deno", "pnpm", "yarn"] as const;

type PackageManager = (typeof packageManagers)[number];

export const packageManagerLabels = {
	bun: "Bun",
	deno: "Deno",
	npm: "npm",
	pnpm: "pnpm",
	yarn: "Yarn",
} satisfies Record<PackageManager, string>;
