import { defineConfig, type UserConfig } from "tsdown";

import { base } from "@flint.fyi/build/tsdown";

const config: UserConfig = defineConfig({
	...base,
	entry: ["src/index.ts", "src/content-mapper.ts"],
});

export default config;
