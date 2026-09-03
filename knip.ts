import type { KnipConfig } from "knip";

const config: KnipConfig = {
	ignore: ["packages/e2e/**/*"],
	ignoreExportsUsedInFile: { interface: true, type: true },
	treatConfigHintsAsErrors: true,
	workspaces: {
		".": {
			entry: ["*.config.{js,ts}"],
			project: ["*.config.{js,ts}", "scripts/**/*.ts"],
		},
		"packages/astro": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/browser": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/build": {
			ignoreDependencies: ["tsdown!"],
			project: ["src/**/*.ts!"],
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
		"packages/performance-testing": {
			entry: ["src/{generate,measure}.ts!"],
			ignoreDependencies: [
				"eslint-plugin-import",
				"eslint-plugin-regexp",
				"eslint-plugin-unicorn",
				"typescript-eslint",
			],
			project: ["src/**/*.ts!"],
		},
		"packages/plugin-flint": {
			ignoreDependencies: [
				// It's bugging IDK.
				"@flint.fyi/rule-tester!",

				// Used only inside rule tester fixture source strings.
				"@flint.fyi/volar-language",
			],
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/rule-data": {
			entry: ["scripts/*.ts"],
			ignoreDependencies: ["@emnapi/core", "@emnapi/runtime"],
			project: ["src/**/*.ts!", "!src/test-utils/*.ts!"],
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
			project: ["src/**/*.{svelte,ts}!", "!src/rules/ruleTester.ts!"],
		},
		"packages/ts": {
			entry: ["src/typescript.d.ts"],
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/vitest": {
			project: ["src/**/*.ts!", "!src/ruleTester.ts!"],
		},
		"packages/vue": {
			ignoreDependencies: [
				// Needed for compiler output in tests
				"vue",
			],
			project: ["src/**/*.{ts,vue}!", "!src/rules/ruleTester.ts!"],
		},
		"packages/vue-language": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/yaml": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
	},
};

export default config;
