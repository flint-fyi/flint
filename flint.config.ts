import { node } from "@flint.fyi/node";
import { performance } from "@flint.fyi/performance";
import { flint } from "@flint.fyi/plugin-flint";
import { spelling } from "@flint.fyi/spelling";
import { defineConfig, globs, json, md, ts, yaml } from "flint";

export default defineConfig({
	ignore: ["coverage/", "packages/e2e/tests/**/fixtures/**/*"],
	use: [
		{
			files: json.files.all,
			rules: json.presets.logical,
		},
		{
			files: md.files.all,
			rules: md.presets.logicalStrict,
		},
		{
			files: {
				exclude: process.env.LINT_FIXTURES ? [] : ["packages/fixtures"],
				include: ts.files.all,
			},
			rules: [
				flint.presets.logical,
				flint.presets.stylistic,
				node.presets.logicalStrict,
				node.presets.stylisticStrict,
				performance.presets.logical,
				performance.rules({ loopFunctions: false }),
				ts.presets.logicalStrict,
				ts.presets.stylisticStrict,
				ts.rules({
					// Pending https://github.com/flint-fyi/flint/issues/2165
					objectShorthand: false,
				}),
			],
		},
		{
			files: {
				exclude: ["pnpm-lock.yaml"],
				include: yaml.files.all,
			},
			rules: yaml.presets.logical,
		},
		{
			files: globs.all,
			rules: spelling.presets.logical,
		},
	],
});
