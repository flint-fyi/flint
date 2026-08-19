import { defineConfig, type UserConfig } from "tsdown";

import { base } from "@flint.fyi/build/tsdown";

const config: UserConfig = defineConfig({
	...base,
	entry: ["src/index.ts", "src/ts-api-utils.ts", "src/typescript.ts"],
});

export default config;
