import { ts } from "@flint.fyi/ts";
import { defineConfig } from "flint";

export default defineConfig({
	use: [
		{
			files: "fixtures/**/*.ts",
			rules: [
				ts.presets.logical,
				ts.rules({
					restrictedTypes: {
						restrictions: [{ specifier: { from: "lib", name: "Date" } }],
					},
				}),
			],
		},
	],
});
