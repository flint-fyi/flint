import { createCaseFiles } from "./creators/createCaseFiles.ts";
import { createFlintConfigFile } from "./creators/files/createFlintConfigFile.ts";
import { createStandardTSConfigFile } from "./creators/files/createStandardTSConfigFile.ts";
import type { FileToWrite, Structure } from "./writing/writeStructure.ts";

export interface NativeScenario {
	label: string;
	language: "astro" | "svelte" | "typescript" | "vue";
	prepare?: string;
	rules: 1 | "many";
	slug: string;
	useCache?: boolean;
}

const cacheCommand =
	"{{flint}} --cache-location .flint-benchmark-cache --skip-formatting --skip-language-reports";
const packageFile: FileToWrite = ['{"type":"module"}', "json"];

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
		prepare: `rm -rf .flint-benchmark-cache && (${cacheCommand} || true)`,
		rules: 1,
		slug: "warm",
		useCache: true,
	},
	{
		label: "One changed file",
		language: "typescript",
		prepare: `cp benchmark-input.ts src/index.ts && rm -rf .flint-benchmark-cache && (${cacheCommand} || true) && printf '\nexport const benchmarkChange = true;\n' >> src/index.ts`,
		rules: 1,
		slug: "changed",
		useCache: true,
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
				throw new Error(
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
