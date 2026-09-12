import path from "node:path";

import { describe, expect, it } from "vitest";

import { openSvelteProject, transformSvelte } from "./content-mapper.ts";
import { createSvelteFileContext } from "./language.ts";

describe("transformSvelte", () => {
	it.each([
		["TypeScript", '<script lang="ts">let count: number = 1;</script>', ".tsx"],
		["JavaScript", "<script>let count = 1;</script>", ".tsx"],
	])("transforms %s script mode", (_, content, extension) => {
		const result = transformSvelte({
			content,
			fileName: "/project/Component.svelte",
			projectHandle: "project",
		});

		expect(result.extension).toBe(extension);
		expect(result.text).toContain("count");
		expect(result.mappings?.length).toBeGreaterThan(0);
	});

	it("maps authored template text and leaves generated scaffolding unmapped", () => {
		const content = "<h1>Hello, 世界 {name}</h1>";
		const result = transformSvelte({
			content,
			fileName: "/project/Component.svelte",
			projectHandle: "project",
		});

		for (const mapping of result.mappings ?? []) {
			expect(mapping[0] + mapping[1]).toBeLessThanOrEqual(result.text.length);
			expect(mapping[2] + mapping[3]).toBeLessThanOrEqual(content.length);
		}
		expect(
			result.mappings?.some(
				(mapping) => mapping[2] === content.indexOf("name"),
			),
		).toBe(true);
		expect(
			result.mappings?.some(
				(mapping) => mapping[0] === 0 && mapping[1] === result.text.length,
			),
		).toBe(false);
	});

	it("returns ranged Svelte diagnostics for malformed input", () => {
		const result = transformSvelte({
			content: "<div>",
			fileName: "/project/Broken.svelte",
			projectHandle: "project",
		});

		expect(result.diagnostics).toEqual([
			expect.objectContaining({ length: 1, start: 0 }),
		]);
	});

	it("preserves svelte2tsx global type imports", () => {
		const result = transformSvelte({
			content: "<button>Save</button>",
			fileName: "/project/Component.svelte",
			projectHandle: "project",
		});

		expect(result.text).toContain("svelte-shims-v4.d.ts");
		expect(result.text).toContain("svelte-native-jsx.d.ts");
		expect(result.text).toContain("svelte-html.d.ts");
	});
});

describe("openSvelteProject", () => {
	it("returns stable project identity and absolute Svelte config watched files", async () => {
		const configFileName = path.join(
			import.meta.dirname,
			"fixtures",
			"tsconfig.json",
		);
		const first = await openSvelteProject({
			compilerOptions: { jsx: 4 },
			configFileName,
			projectHandle: "first",
		});
		const second = await openSvelteProject({
			compilerOptions: { jsx: 4 },
			configFileName,
			projectHandle: "second",
		});

		expect(first.configIdentity).toBeTruthy();
		expect(second.configIdentity).toBe(first.configIdentity);
		expect(first.watchedFiles?.every(path.isAbsolute)).toBe(true);
	});

	it("reports invalid mapper options through protocol option diagnostics", async () => {
		const project = await openSvelteProject({
			compilerOptions: {},
			configFileName: "/project/tsconfig.json",
			options: { unexpected: true },
			projectHandle: "project",
		});

		expect(project.validateOptions?.()).toEqual([
			{
				messageText: 'Unknown Svelte content mapper option "unexpected".',
				path: ["unexpected"],
			},
		]);
	});
});

describe(createSvelteFileContext, () => {
	it("provides an empty context when Svelte cannot parse the source", () => {
		const context = createSvelteFileContext("<script>let =</script>");

		expect(context.services.svelte.ast.fragment.nodes).toEqual([]);
		expect(context.directives).toEqual([]);
	});
});
