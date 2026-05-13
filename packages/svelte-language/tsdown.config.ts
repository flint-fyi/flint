import { defineConfig } from "tsdown";

export default defineConfig({
	attw: {
		enabled: "ci-only",
		profile: "esm-only",
	},
	clean: ["./node_modules/.cache/tsbuild/"],
	deps: {
		// [MISSING_EXPORT] Warning: "AST" is not exported by "../../node_modules/.pnpm/svelte@5.54.0/node_modules/svelte/types/index.d.ts"
		// https://github.com/sveltejs/svelte/issues/17520
		// https://github.com/sxzz/rolldown-plugin-dts/issues/170
		neverBundle: ["svelte/compiler"],
	},
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
});
