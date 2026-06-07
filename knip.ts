import type { KnipConfig } from "knip";

export default {
	ignore: ["packages/e2e/**/*"],
	ignoreExportsUsedInFile: { interface: true, type: true },
	treatConfigHintsAsErrors: true,
	workspaces: {
		".": {
			entry: ["*.config.{js,ts}"],
			ignoreDependencies: [
				// The changesets CLI isn't directly referenced anywhere, but we need it to create new changesets.
				"@changesets/cli",
			],
			project: ["*.config.{js,ts}", "scripts/**/*.ts"],
		},
		"packages/astro": {
			ignoreDependencies: [
				// https://github.com/webpro-nl/knip/issues/248
				"@astrojs/compiler!",
			],
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/browser": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/comparisons": {
			entry: ["src/sort-data.ts!"],
			project: ["src/**/*.ts!", "!src/test-utils/*.ts!"],
		},
		"packages/css": {
			project: ["src/**/*.ts!", "!src/ruleTester.ts!"],
		},
		"packages/json": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/jsx": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/markdown-language": {
			ignoreDependencies: [
				// https://github.com/webpro-nl/knip/issues/248
				"@types/mdast!",
				"@types/unist!",
			],
		},
		"packages/md": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/node": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/package-json": {
			project: ["src/**/*.ts!", "!src/ruleTester.ts!"],
		},
		"packages/performance": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/plugin-flint": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/site": {
			ignoreDependencies: [
				// Needed for Twoslash
				"@flint.fyi/typescript-language",
				"zod",

				// https://github.com/JoshuaKGoldberg/emoji-blast/issues/969
				"konami-emoji-blast!",
			],
		},
		"packages/spelling": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/svelte": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/ts": {
			project: [
				"src/**/*.ts!",
				"!src/typescript.d.ts",
				"!src/rules/ruleTester.ts!",
			],
		},
		"packages/vitest": {
			project: ["src/**/*.ts!", "!src/ruleTester.ts!"],
		},
		"packages/volar-language": {
			// https://github.com/webpro-nl/knip/issues/248
			ignoreDependencies: ["@volar/language-core!"],
		},
		"packages/vue": {
			ignoreDependencies: [
				// Needed for compiler output in tests
				"vue",
			],
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/vue-language": {
			ignoreDependencies: [
				// https://github.com/webpro-nl/knip/issues/248
				"@volar/language-core!",
			],
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/yaml": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
	},
} satisfies KnipConfig;
