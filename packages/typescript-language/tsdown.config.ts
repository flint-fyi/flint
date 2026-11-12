import { defineConfig, type UserConfig } from "tsdown";

import { base } from "@flint.fyi/build/tsdown";

const config: UserConfig = defineConfig({
	...base,
	entry: [
		"src/index.ts",
		"src/native/ast.ts",
		"src/native/fs.ts",
		"src/native/sync.ts",
	],
});

export default config;
