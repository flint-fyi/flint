import { changesets } from "@flint.fyi/changesets";
import { node } from "@flint.fyi/node";
import { performance } from "@flint.fyi/performance";
import { flint } from "@flint.fyi/plugin-flint";
import { spelling } from "@flint.fyi/spelling";
import { vitest } from "@flint.fyi/vitest";
import {
	defineConfig,
	globs,
	json,
	md,
	packageJson,
	ts,
	yaml,
	type Config,
} from "flint";

const config: Config = defineConfig({
	ignore: ["coverage/", "packages/e2e/tests/**/fixtures/**/*"],
	use: [
		{
			files: {
				exclude: ["packages/e2e/tests/**/package.json"],
				include: packageJson.files.all,
			},
			rules: [
				packageJson.presets.logical,
				packageJson.presets.sorting,
				packageJson.presets.stylistic,
			],
		},
		{
			files: changesets.files.all,
			rules: [changesets.presets.logical, changesets.presets.stylistic],
		},
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
				flint.presets.stylisticStrict,
				node.presets.logicalStrict,
				node.presets.stylisticStrict,
				performance.presets.logical,
				performance.rules({ loopFunctions: false }),
				ts.presets.logicalStrict,
				ts.presets.stylisticStrict,
				ts.rules({
					// Pending https://github.com/flint-fyi/flint/issues/2165
					objectShorthand: false,
					// This repository does not yet avoid reassigning parameters.
					parameterReassignments: false,
					// Only reports regexes run on short strings such as comments and regex sources.
					regexSuperLinearMoves: false,
					// These report false positives on this repository's own code.
					regexUnnecessaryAssertions: false,
					regexUnusedCapturingGroups: false,
					tripleSlashReferenceValidity: false,
					unnecessaryBooleanCasts: false,
					unnecessaryEscapes: false,
				}),
			],
		},
		{
			files: vitest.files.all,
			rules: [vitest.presets.logicalStrict, vitest.presets.stylisticStrict],
		},
		{
			files: {
				exclude: ["pnpm-lock.yaml"],
				include: yaml.files.all,
			},
			rules: yaml.presets.logical,
		},
		{
			files: [".github/workflows/*.yaml"],
			rules: [yaml.rules({ stringMappingKeys: false })],
		},
		{
			files: [globs.all, "**/*.mdx"],
			rules: spelling.presets.logical,
		},
	],
});

export default config;
