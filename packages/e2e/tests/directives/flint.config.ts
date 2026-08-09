import { spelling } from "@flint.fyi/spelling";
import { ts } from "@flint.fyi/ts";
import { defineConfig, type Config } from "flint";

const config: Config = defineConfig({
	use: [
		{
			files: "fixtures/**/*.ts",
			rules: [spelling.presets.logical, ts.presets.logical],
		},
	],
});

export default config;
