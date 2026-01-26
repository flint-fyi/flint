import { node } from "@flint.fyi/node";
import { flint } from "@flint.fyi/plugin-flint";
import { spelling } from "@flint.fyi/spelling";
import { defineConfig, globs, json, md, ts, yaml } from "flint";

export default defineConfig({
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
				node.presets.logical,
				node.presets.logicalStrict,
				node.presets.stylistic,
				node.presets.stylisticStrict,
				ts.presets.logical,
				ts.presets.logicalStrict,
				ts.presets.stylistic,
				ts.presets.stylisticStrict,
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
		{
			files: globs.all,
			rules: [
				ts.rules({
					functionDeclarationStyles: false,
				}),
			],
		},
	],
});

const a = Promise.resolve().catch((any) => any);
