import type { UserConfig } from "tsdown";

export const base: UserConfig = {
	attw: {
		enabled: "ci-only",
		profile: "esm-only",
	},
	clean: ["./node_modules/.cache/tsbuild/"],
	dts: { build: true, incremental: true },
	entry: ["src/index.ts"],
	exports: {
		devExports: true,
		packageJson: false,
	},
	failOnWarn: true,
	fixedExtension: false,
	outDir: "lib",
	unbundle: true,
};
