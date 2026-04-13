import { spelling } from "@flint.fyi/spelling";
import { defineConfig } from "flint";

export default defineConfig({
	use: [
		{
			files: "fixtures/**",
			rules: spelling.presets.logical,
		},
	],
});
