import { defineConfig } from "tsdown";

export default defineConfig({
	attw: {
		enabled: "ci-only",
		profile: "esm-only",
	},
	clean: ["./node_modules/.cache/tsbuild/"],
	dts: { build: true, incremental: true },
	entry: ["src/index.ts", "src/install-patch.ts", "src/install-patch-hooks.ts"],
	exports: {
		devExports: "@flint.fyi/source",
		packageJson: false,
	},
	failOnWarn: true,
	fixedExtension: false,
	outDir: "lib",
	treeshake: false,
	unbundle: true,
});
