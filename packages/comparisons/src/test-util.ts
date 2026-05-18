import eslintJsonPlugin from "@eslint/json";
import markdownPlugin from "@eslint/markdown";
import eslintCommentsPlugin from "@eslint-community/eslint-plugin-eslint-comments";
import nextPlugin from "@next/eslint-plugin-next";
import nuxtPlugin from "@nuxt/eslint-plugin";
import tseslintPlugin from "@typescript-eslint/eslint-plugin";
import vitestPlugin from "@vitest/eslint-plugin";
import astroPlugin from "eslint-plugin-astro";
import eslintPluginPlugin from "eslint-plugin-eslint-plugin";
import importPlugin from "eslint-plugin-import";
import jsdocPlugin from "eslint-plugin-jsdoc";
import jsoncPlugin from "eslint-plugin-jsonc";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import nodePlugin from "eslint-plugin-n";
import packageJsonPlugin from "eslint-plugin-package-json";
import perfectionistPlugin from "eslint-plugin-perfectionist";
import promisePlugin from "eslint-plugin-promise";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import regexpPlugin from "eslint-plugin-regexp";
import solidPlugin from "eslint-plugin-solid";
import sveltePlugin from "eslint-plugin-svelte";
import unicornPlugin from "eslint-plugin-unicorn";
import vuePlugin from "eslint-plugin-vue";
import ymlPlugin from "eslint-plugin-yml";

import { comparisons } from "./index.ts";

export function findESLintRulesInCore() {
	return comparisons.flatMap(
		(comparison) =>
			comparison.eslint?.filter((rule) =>
				rule.url.includes("/eslint.org/docs"),
			) ?? [],
	);
}

export function findESLintRulesInPlugin(pluginName: string) {
	return comparisons.flatMap(
		(comparison) =>
			comparison.eslint?.filter((rule) =>
				rule.name.startsWith(`${pluginName}/`),
			) ?? [],
	);
}

export const pluginsRulesByName = new Map([
	["@eslint-community/eslint-comments", eslintCommentsPlugin.rules],
	["@next/next", nextPlugin.rules],
	["@typescript-eslint", tseslintPlugin.rules],
	["astro", astroPlugin.rules],
	["eslint-plugin", eslintPluginPlugin.rules],
	["import", importPlugin.rules],
	["jsdoc", jsdocPlugin.rules as object],
	["json", eslintJsonPlugin.rules],
	["jsonc", jsoncPlugin.rules],
	["jsx-a11y", jsxA11yPlugin.rules as object],
	["markdown", markdownPlugin.rules],
	["n", nodePlugin.rules as object],
	["nuxt", nuxtPlugin.rules],
	["package-json", packageJsonPlugin.rules],
	["perfectionist", perfectionistPlugin.rules as object],
	["promise", promisePlugin.rules],
	["react", reactPlugin.rules],
	["react-hooks", reactHooksPlugin.rules],
	["regexp", regexpPlugin.rules],
	["solid", solidPlugin.rules],
	["svelte", sveltePlugin.rules],
	["unicorn", unicornPlugin.rules as object],
	["vitest", vitestPlugin.rules],
	["vue", vuePlugin.rules],
	["yml", ymlPlugin.rules],
]);
