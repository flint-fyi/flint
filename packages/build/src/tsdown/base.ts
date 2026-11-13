import type { UserConfig } from "tsdown";

export const base: UserConfig = {
	attw: {
		enabled: "ci-only",
		profile: "esm-only",
	},
	clean: ["./node_modules/.cache/tsbuild/"],
	dts: {
		generator: "tsgo",
		tsgo: { moduleUrl: import.meta.resolve("@typescript/native") },
	},
	entry: ["src/index.ts"],
	exports: {
		devExports: true,
	},
	failOnWarn: true,
	suppressWarnings: [
		"TypeScript Go is experimental. Some options will be unavailable.",
	],
	tsconfig: "tsconfig.src.json",
};
