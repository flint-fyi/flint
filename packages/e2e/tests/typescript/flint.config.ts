import { ts } from "@flint.fyi/ts";
import { defineConfig, type Config } from "flint";

const config: Config = defineConfig({
	use: [
		{
			files: "fixtures/**/*.ts",
			rules: [ts.presets.logical, ts.rules({ typeExports: true })],
		},
	],
});

export default config;
