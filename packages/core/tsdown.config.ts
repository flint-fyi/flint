import { defineConfig, type UserConfig } from "tsdown";

import { base } from "@flint.fyi/build/tsdown";

const config: UserConfig[] = defineConfig([
	{
		...base,
		entry: ["src/index.ts"],
		fixedExtension: true,
		platform: "neutral",
	},
	{ ...base, entry: ["src/node.ts"], platform: "node" },
]);

export default config;
