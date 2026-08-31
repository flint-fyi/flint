import { spelling } from "@flint.fyi/spelling";
import { defineConfig, type Config } from "flint";

const config: Config = defineConfig({
	use: [
		{
			files: "fixtures/**",
			rules: spelling.presets.logical,
		},
	],
});

export default config;
