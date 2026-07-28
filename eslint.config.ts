import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import eslint from "@eslint/js";
import eslintJson from "@eslint/json";
import markdown from "@eslint/markdown";
import vitest from "@vitest/eslint-plugin";
import jsdoc from "eslint-plugin-jsdoc";
import jsonc from "eslint-plugin-jsonc";
import n from "eslint-plugin-n";
import packageJson from "eslint-plugin-package-json/experimental";
import perfectionist from "eslint-plugin-perfectionist";
import * as regexp from "eslint-plugin-regexp";
import unicorn from "eslint-plugin-unicorn";
import yml from "eslint-plugin-yml";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

// https://typescript-eslint.io/troubleshooting/typed-linting/performance#importextensions-enforcing-extensions-are-not-used
function banJsImportExtension() {
	const message = `Unexpected use of .js file extension (.js) in import; please use .ts`;
	const literalAttributeMatcher = String.raw`Literal[value=/\..+\.js$/]`;
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
			unicorn.configs.unopinionated,
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
			"@typescript-eslint/consistent-type-exports": "error",
			"@typescript-eslint/consistent-type-imports": "error",
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

			// Covered by Prettier plugin
			"perfectionist/sort-imports": "off",
			"perfectionist/sort-named-imports": "off",

			// `Symbol.dispose` and `Symbol.asyncDispose` are standard ES2026
			// (explicit resource management, shipped in Node 24) but the rule's
			// static builtin list has no ignore option and hasn't caught up.
			"unicorn/no-nonstandard-builtin-properties": "off",

			// Language plugins intentionally register extensions and enforce
			// single-instance invariants at module load time.
			"unicorn/no-top-level-side-effects": "off",

			// Too opinionated.
			"unicorn/prefer-await": "off",

			// Conflicts with Prettier: Prettier lowercases hex digits
			// (0xff) while this rule wants uppercase (0xFF).
			"unicorn/number-literal-case": "off",

			// Conflicts with Flint's own ts/regexLetterCasing which
			// requires lowercase unicode escapes (\u{a0}) for consistency.
			"unicorn/escape-case": "off",

			// Conflicts with Flint's own ts/regexHexadecimalEscapes which
			// prefers the more succinct \xa0 over \u{a0}.
			"unicorn/prefer-unicode-code-point-escapes": "off",

			// Test files for escape-related rules intentionally use \\ in
			// regular template literals so the source contains literal
			// backslashes; converting to String.raw exposes \8/\9 escapes
			// that trigger ts/nonOctalDecimalEscapes on the test itself.
			"unicorn/prefer-string-raw": "off",

			// Use the type-aware version.
			"@typescript-eslint/require-array-sort-compare": [
				"error",
				{ ignoreStringArrays: true },
			],
			"unicorn/require-array-sort-compare": "off",
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
