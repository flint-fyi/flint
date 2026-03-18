import { defineConfig } from "tsdown";

export default defineConfig({
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
	// probably a bug in Rolldown: [MISSING_EXPORT] Warning: "AST" is not exported by "../../node_modules/.pnpm/svelte@5.54.0/node_modules/svelte/types/index.d.ts"
	failOnWarn: false,
	fixedExtension: false,
	outDir: "lib",
	unbundle: true,
});
