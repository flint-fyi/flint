import { astro } from "@flint.fyi/astro";
import { svelte } from "@flint.fyi/svelte";
import { ts } from "@flint.fyi/ts";
import { vue } from "@flint.fyi/vue";
import { defineConfig, type Config } from "flint";

const config: Config = defineConfig({
	use: [
		{ files: ["fixtures/**/*.{js,ts}"], rules: ts.presets.logical },
		{ files: "fixtures/**/*.astro", rules: astro.presets.logical },
		{ files: "fixtures/**/*.svelte", rules: svelte.presets.logical },
		{ files: "fixtures/**/*.vue", rules: vue.presets.logical },
	],
});

export default config;
