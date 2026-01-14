import eslint from "@eslint/js";
import markdown from "@eslint/markdown";
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import vitest from "@vitest/eslint-plugin";
import type { Linter } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import jsdoc from "eslint-plugin-jsdoc";
import jsonc from "eslint-plugin-jsonc";
import n from "eslint-plugin-n";
import packageJson from "eslint-plugin-package-json";
import perfectionist from "eslint-plugin-perfectionist";
import { Alphabet } from "eslint-plugin-perfectionist/alphabet";
import * as regexp from "eslint-plugin-regexp";
import yml from "eslint-plugin-yml";
import tseslint from "typescript-eslint";

const importAlphabet = Alphabet.generateRecommendedAlphabet()
	.sortByNaturalSort()
	.placeCharacterBefore({ characterAfter: "-", characterBefore: "/" })
	.placeCharacterBefore({ characterAfter: "/", characterBefore: "." })
	.getCharacters();

// https://typescript-eslint.io/troubleshooting/typed-linting/performance#importextensions-enforcing-extensions-are-not-used
function banJsImportExtension() {
	const message = `Unexpected use of .js file extension (.js) in import; please use .ts`;
	const literalAttributeMatcher = `Literal[value=/\\.js$/]`;
	return [
		{
			message,
			// import foo from 'bar.js';
			selector: `ImportDeclaration > ${literalAttributeMatcher}.source`,
		},
		{
			message,
			// export { foo } from 'bar.js';
			selector: `ExportNamedDeclaration > ${literalAttributeMatcher}.source`,
		},
		{
			message,
			// type Foo = typeof import('bar.js');
			selector: `TSImportType > TSLiteralType > ${literalAttributeMatcher}`,
		},
	];
}

export default defineConfig(
	globalIgnores([
		"**/*.snap",
		"**/node_modules",
		"packages/*/.astro",
		"packages/*/dist",
		"packages/*/lib",
		"packages/fixtures",
		"pnpm-lock.yaml",
	]),
	{ linterOptions: { reportUnusedDisableDirectives: "error" } },
	{
		extends: [
			comments.recommended,
			eslint.configs.recommended,
			jsdoc.configs["flat/contents-typescript-error"],
			jsdoc.configs["flat/logical-typescript-error"],
			jsdoc.configs["flat/stylistic-typescript-error"],
			n.configs["flat/recommended"],
			// https://github.com/azat-io/eslint-plugin-perfectionist/issues/655
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			perfectionist.configs!["recommended-natural"] as Linter.Config,
			regexp.configs["flat/recommended"],
			tseslint.configs.strictTypeChecked,
			tseslint.configs.stylisticTypeChecked,
		],
		files: ["**/*.{js,ts}"],
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
		rules: {
			"@typescript-eslint/no-import-type-side-effects": "error",
			"@typescript-eslint/no-unnecessary-condition": [
				"error",
				{ allowConstantLoopConditions: true },
			],
			"@typescript-eslint/restrict-template-expressions": [
				"error",
				{ allowNumber: true },
			],
			"n/no-missing-import": "off",
			"n/no-unsupported-features/node-builtins": [
				"error",
				{ allowExperimental: true },
			],

			// Stylistic concerns that don't interfere with Prettier
			"logical-assignment-operators": [
				"error",
				"always",
				{ enforceForIfStatements: true },
			],
			"no-useless-rename": "error",
			"object-shorthand": "error",
			"operator-assignment": "error",

			// https://github.com/eslint-community/eslint-plugin-n/issues/472
			"n/no-unpublished-bin": "off",

			"no-restricted-syntax": ["error", ...banJsImportExtension()],

			"perfectionist/sort-imports": [
				"error",
				{
					alphabet: importAlphabet,
					groups: [
						"side-effect",
						["builtin", "external"],
						["parent", "sibling", "index", "subpath"],
						"unknown",
					],

					partitionByNewLine: false,
					type: "custom",
				},
			],
		},
		settings: {
			n: {
				convertPath: [
					{
						exclude: ["**/ruleTester.ts", "**/*.test.ts", "**/*.test-d.ts"],
						include: ["packages/*/src/**/*.ts"],
						replace: ["src/(.+).ts$", "lib/$1.js"],
					},
				],
			},
			perfectionist: { partitionByComment: true, type: "natural" },
		},
	},
	{
		extends: [
			// https://github.com/ota-meshi/eslint-plugin-jsonc/issues/385
			jsonc.configs["flat/recommended-with-json"] as unknown as Linter.Config[],
		],
		files: ["**/*.json"],
		ignores: ["**/tsconfig.json", "**/tsconfig.*.json"],
	},
	{
		extends: [
			// https://github.com/ota-meshi/eslint-plugin-jsonc/issues/385
			jsonc.configs[
				"flat/recommended-with-jsonc"
			] as unknown as Linter.Config[],
		],
		files: ["**/tsconfig.json", "**/tsconfig.*.json", "**/*.jsonc"],
	},
	{
		extends: [markdown.configs.recommended],
		files: ["**/*.md"],
		rules: {
			// https://github.com/eslint/markdown/issues/294
			"markdown/no-missing-label-refs": "off",
		},
	},
	{
		extends: [tseslint.configs.disableTypeChecked],
		files: ["**/*.md/*.ts"],
		rules: { "n/no-missing-import": "off" },
	},
	{
		extends: [vitest.configs.recommended],
		files: ["**/*.test.*"],
		rules: { "@typescript-eslint/no-unsafe-assignment": "off" },
		settings: { vitest: { typecheck: true } },
	},
	{
		extends: [
			// https://github.com/ota-meshi/eslint-plugin-yml/issues/510
			yml.configs["flat/standard"] as unknown as Linter.Config[],
			yml.configs["flat/prettier"] as unknown as Linter.Config[],
		],
		files: ["**/*.{yml,yaml}"],
		rules: {
			"yml/file-extension": "error",
			"yml/sort-keys": [
				"error",
				{ order: { type: "asc" }, pathPattern: "^.*$" },
			],
			"yml/sort-sequence-values": [
				"error",
				{ order: { type: "asc" }, pathPattern: "^.*$" },
			],
		},
	},
	{
		extends: [packageJson.configs.recommended, packageJson.configs.stylistic],
	},
	{
		extends: [packageJson.configs["recommended-publishable"]],
		files: [["packages/*/package.json", "!packages/site/package.json"]],
	},
);
