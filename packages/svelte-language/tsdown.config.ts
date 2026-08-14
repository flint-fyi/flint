import { defineConfig, type UserConfig } from "tsdown";

import { base } from "@flint.fyi/build/tsdown";

const config: UserConfig = defineConfig({
	...base,
	deps: {
		// [MISSING_EXPORT] Warning: "AST" is not exported by "../../node_modules/.pnpm/svelte@5.54.0/node_modules/svelte/types/index.d.ts"
		// https://github.com/sveltejs/svelte/issues/17520
		// https://github.com/sxzz/rolldown-plugin-dts/issues/170
		neverBundle: ["svelte/compiler"],
	},
});

export default config;
