import type { Config } from "prettier";

/**
 * @see https://prettier.io/docs/configuration
 */
export default {
	importOrder: [
		"<BUILTIN_MODULES>",
		"",
		"<THIRD_PARTY_MODULES>",
		"",
		"^(@flint.fyi/.*|flint)$",
		"",
		"^[.]",
	],
	importOrderTypeScriptVersion: "5.0.0",
	overrides: [
		{ files: ".nvmrc", options: { parser: "yaml" } },
		{
			files: ".all-contributorsrc",
			options: { parser: "json-stringify", useTabs: false },
		},
		{ files: "cspell.json", options: { parser: "json-stringify" } },
	],
	plugins: [
		"prettier-plugin-astro",
		"prettier-plugin-curly",
		"prettier-plugin-packagejson",
		"prettier-plugin-sentences-per-line",
		"prettier-plugin-sh",
		"@ianvs/prettier-plugin-sort-imports",
	],
	useTabs: true,
	vueIndentScriptAndStyle: true,
} satisfies Config;
