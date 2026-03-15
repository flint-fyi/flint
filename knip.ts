import type { KnipConfig } from "knip";

const frontmatterMatcher = /^---\r?\n([\s\S]*?)\r?\n---/;
const scriptBodyExtractor = /<script\b[^>]*>(?<body>[\s\S]*?)<\/script>/g;

export default {
	compilers: {
		astro: (text) => {
			const scripts: string[] = [];
			const frontmatter = frontmatterMatcher.exec(text);
			if (frontmatter?.[1]) {
				// Emulate `ignoreExportsUsedInFile.interface` by transforming `export interface Props` into `interface Props`.
				scripts.push(frontmatter[1].replace(/\bexport\b/g, ""));
			}
			let scriptMatch: null | RegExpExecArray;
			while ((scriptMatch = scriptBodyExtractor.exec(text))) {
				if (scriptMatch.groups?.body) {
					scripts.push(scriptMatch.groups.body);
				}
			}
			return scripts.join("\n");
		},
	},
	ignore: ["packages/e2e/**/*"],
	ignoreExportsUsedInFile: { interface: true, type: true },
	treatConfigHintsAsErrors: true,
	workspaces: {
		".": {
			entry: ["*.config.{js,ts}"],
			project: ["*.config.{js,ts}", "scripts/**/*.ts"],
		},
		"packages/browser": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/comparisons": {
			entry: ["src/sort-data.ts!"],
			project: ["src/**/*.ts!", "!src/test-util.ts!"],
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
		"packages/performance": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/plugin-flint": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/site": {
			ignoreDependencies: [
				// Needed for Twoslash
				"@flint.fyi/core",
				"@flint.fyi/typescript-language",
				"zod",

				// https://github.com/JoshuaKGoldberg/emoji-blast/issues/969
				"konami-emoji-blast!",

				// https://docs.astro.build/en/reference/errors/missing-sharp/
				"sharp",
			],
		},
		"packages/spelling": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/ts": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
		"packages/volar-language": {
			// https://github.com/webpro-nl/knip/issues/248
			ignoreDependencies: ["@volar/language-core!"],
		},
		"packages/yaml": {
			project: ["src/**/*.ts!", "!src/rules/ruleTester.ts!"],
		},
	},
} satisfies KnipConfig;
