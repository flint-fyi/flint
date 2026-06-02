import eslint from "@eslint/js";
import eslintJson from "@eslint/json";
import markdown from "@eslint/markdown";
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import vitest from "@vitest/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import jsdoc from "eslint-plugin-jsdoc";
import jsonc from "eslint-plugin-jsonc";
import n from "eslint-plugin-n";
import packageJson from "eslint-plugin-package-json/experimental";
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
	const literalAttributeMatcher = `Literal[value=/\\..+\\.js$/]`;
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
		"packages/e2e/tests/**/fixtures/**",
		"pnpm-lock.yaml",
		"coverage",
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
			perfectionist.configs["recommended-natural"],
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
			"@eslint-community/eslint-comments/disable-enable-pair": [
				"error",
				{ allowWholeFile: true },
			],
			"@typescript-eslint/no-import-type-side-effects": "error",
			"@typescript-eslint/no-unnecessary-condition": [
				"error",
				{ allowConstantLoopConditions: true },
			],
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					enableAutofixRemoval: {
						imports: true,
					},
					ignoreUsingDeclarations: true,
				},
			],
			"@typescript-eslint/prefer-nullish-coalescing": [
				"error",
				{ ignorePrimitives: true },
			],
			"@typescript-eslint/restrict-template-expressions": [
				"error",
				{ allowNumber: true },
			],
			eqeqeq: ["error", "always", { null: "ignore" }],
			"jsdoc/check-tag-names": [
				"error",
				// https://tsdoc.org/pages/tags/remarks
				{ definedTags: ["remarks"], typed: true },
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

			// Covered by knip
			"n/no-extraneous-import": "off",
			"n/no-extraneous-require": "off",
			"n/no-unpublished-import": "off",
			"n/no-unpublished-require": "off",

			// Restrict imports
			"@typescript-eslint/no-restricted-imports": [
				"error",
				{
					message: "Use zod/v4 for the modern v4 API instead.",
					name: "zod",
				},
			],
			// Use no-restricted-syntax to target e.g. `type Foo = typeof import('foo.js')` as well.
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
			perfectionist: { partitionByComment: true, type: "natural" },
		},
	},
	{
		files: ["packages/core/**/*.ts"],
		ignores: ["packages/core/**/*.test.ts"],
		rules: {
			"@typescript-eslint/no-restricted-imports": [
				"error",
				{
					message:
						"Use Standard Schema for abstractions or Zod Core for parsing.",
					name: "zod",
				},
				{
					message:
						"Use Standard Schema for abstractions or Zod Core for parsing.",
					name: "zod/v4",
				},
			],
		},
	},
	{
		files: ["packages/site/**/*.ts"],
		rules: {
			"@typescript-eslint/no-restricted-imports": [
				"error",
				{
					paths: [
						{
							message: "Use astro/zod instead of the main Zod package.",
							name: "zod",
						},
					],
					patterns: [
						{
							group: ["zod/*"],
							message: "Use astro/zod instead of the main Zod package.",
						},
					],
				},
			],
		},
	},
	{
		extends: [jsonc.configs["flat/recommended-with-json"]],
		files: ["**/*.json"],
		ignores: ["**/tsconfig.json", "**/tsconfig.*.json"],
	},
	{
		extends: [jsonc.configs["flat/recommended-with-jsonc"]],
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
	// E2E tests and configs live next to fixture package.json (no vitest/execa/@flint.fyi/ts); allow packages/e2e devDependencies
	// E2E runs on Node >=24 (see packages/e2e/package.json engines), so import.meta.dirname is supported
	{
		files: ["packages/e2e/tests/**/*.ts"],
		rules: {
			"n/no-unsupported-features/node-builtins": "off",
		},
	},
	{
		extends: [yml.configs["flat/standard"], yml.configs["flat/prettier"]],
		files: ["**/*.{yml,yaml}"],
		rules: {
			"yml/file-extension": "error",
			"yml/sort-sequence-values": [
				"error",
				{ order: { type: "asc" }, pathPattern: "^.*$" },
			],
		},
	},
	{
		extends: [packageJson.configs.recommended, packageJson.configs.stylistic],
		files: ["**/package.json"],
		ignores: ["packages/e2e/tests/**/package.json"],
		plugins: { json: eslintJson },
		rules: {
			"package-json/require-homepage": "error",
		},
	},
);
