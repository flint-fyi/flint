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
			rules: json.preset("logical"),
		},
		{
			files: md.files.all,
			rules: md.preset("logicalStrict"),
		},
		{
			files: {
				exclude: process.env.LINT_FIXTURES ? [] : ["packages/fixtures"],
				include: ts.files.all,
			},
			rules: [
				flint.preset("logical"),
				flint.preset("stylistic"),
				flint.preset("stylisticStrict"),
				node.preset("logicalStrict"),
				node.preset("stylisticStrict"),
				performance.preset("logical"),
				performance.rules({ loopFunctions: false }),
				ts.preset("logicalStrict"),
				ts.preset("stylisticStrict"),
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
			rules: yaml.preset("logical"),
		},
		{
			files: globs.all,
			rules: spelling.preset("logical"),
		},
	],
});
