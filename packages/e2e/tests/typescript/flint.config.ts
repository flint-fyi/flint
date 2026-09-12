import { ts } from "@flint.fyi/ts";
import { defineConfig, type Config } from "flint";

const config: Config = defineConfig({
	use: [
		{
			files: "fixtures/**/*.ts",
			rules: [
				ts.presets.logical,
				ts.rules({
					restrictedProperties: {
						restrictions: [
							{
								object: { from: "lib", name: "JSON" },
								property: "parse",
							},
						],
					},
				}),
			],
		},
	],
});

export default config;
