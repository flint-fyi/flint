import { defineConfig, type UserConfig } from "tsdown";

import { base } from "@flint.fyi/build/tsdown";

const config: UserConfig = defineConfig({
	...base,
	entry: ["src/index.ts", "src/install-patch.ts", "src/install-patch-hooks.ts"],
	treeshake: false,
});

export default config;
