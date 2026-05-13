import { spelling } from "@flint.fyi/spelling";
import { ts } from "@flint.fyi/ts";
import { defineConfig } from "flint";

export default defineConfig({
	use: [
		{
			files: "fixtures/**/*.ts",
			rules: [spelling.presets.logical, ts.presets.logical],
		},
	],
});
