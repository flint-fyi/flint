import { createCaseFiles } from "./creators/createCaseFiles.ts";
import { createFlintConfigFile } from "./creators/files/createFlintConfigFile.ts";
import { createStandardTSConfigFile } from "./creators/files/createStandardTSConfigFile.ts";
import type { FileToWrite, Structure } from "./writing/writeStructure.ts";

export interface NativeScenario {
	label: string;
	language: "astro" | "svelte" | "typescript" | "vue";

	/**
	 * Creates a shell script run before each sample, given the cached Flint
	 * command being measured. Scenarios without one are measured uncached.
	 */
	prepare?: (flint: string) => string;

	rules: 1 | "many";
	slug: string;
}

export const nativeCacheLocation = ".flint-benchmark-cache";

const packageFile: FileToWrite = ['{"type":"module"}', "json"];

function createWarmCacheScript(flint: string): string {
	return `rm -rf ${nativeCacheLocation} && (${flint} || true)`;
}

export const nativeScenarios: NativeScenario[] = [
	{
		label: "Cold project startup",
		language: "typescript",
		rules: 1,
		slug: "cold",
	},
	{
		label: "Warm unchanged lint",
		language: "typescript",
		prepare: createWarmCacheScript,
		rules: 1,
		slug: "warm",
	},
	{
		label: "One changed file",
		language: "typescript",
		prepare: (flint) =>
			`cp benchmark-input.ts src/index.ts && ${createWarmCacheScript(flint)} && printf '\nexport const benchmarkChange = true;\n' >> src/index.ts`,
		rules: 1,
		slug: "changed",
	},
	{
		label: "Type-aware rules",
		language: "typescript",
		rules: "many",
		slug: "type-aware",
	},
	{ label: "Astro", language: "astro", rules: 1, slug: "astro" },
	{ label: "Svelte", language: "svelte", rules: 1, slug: "svelte" },
	{ label: "Vue", language: "vue", rules: 1, slug: "vue" },
];

const embeddedSources = {
	astro: `---
const title: string = "Benchmark";
---
<main><h1>{title}</h1><p>{Math.random()}</p></main>`,
	svelte: `<script lang="ts">
	let count: number = 0;
</script>
<button onclick={() => count += 1}>{count}</button>`,
	vue: `<script setup lang="ts">
const items: string[] = ["one", "two", "three"];
</script>
<template><ul><li v-for="item in items" :key="item">{{ item }}</li></ul></template>`,
} as const;

export function createNativeScenarioFiles(scenario: NativeScenario): Structure {
	const { language } = scenario;
	if (language === "typescript") {
		const files = createCaseFiles({ files: 256, rules: scenario.rules });
		const structure: Structure = {
			"flint.config.ts": [createFlintConfigFile(scenario.rules), "typescript"],
			"package.json": packageFile,
			src: files.src as Structure,
			"tsconfig.json": [createStandardTSConfigFile(), "json"],
		};

		if (scenario.slug === "changed") {
			const indexFile = (files.src as Structure)["index.ts"];
			if (!Array.isArray(indexFile)) {
				throw new TypeError(
					"Expected the generated TypeScript index to be a file.",
				);
			}

			structure["benchmark-input.ts"] = [indexFile[0], "typescript"];
		}

		return structure;
	}

	return {
		"flint.config.ts": [createEmbeddedConfig(language), "typescript"],
		"package.json": packageFile,
		src: Object.fromEntries(
			Array.from({ length: 128 }, (_, index) => [
				`component-${index}.${language}`,
				[embeddedSources[language], "html"],
			]),
		),
		"tsconfig.json": [createStandardTSConfigFile(), "json"],
	};
}

function createEmbeddedConfig(language: "astro" | "svelte" | "vue"): string {
	return `
import { ${language} } from "@flint.fyi/${language}";
import { defineConfig } from "flint";

export default defineConfig({
	ignore: ["node_modules", "*.config.*"],
	use: [{ files: "src/**/*.${language}", rules: ${language}.presets.logical }],
});
`;
}
