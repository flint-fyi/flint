import { ts } from "@flint.fyi/ts";
import { defineConfig } from "flint";

export default defineConfig({
	use: [
		{
			files: "fixtures/**/*.ts",
			rules: ts.presets.logical,
		},
	],
});
