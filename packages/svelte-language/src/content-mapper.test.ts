import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { openSvelteProject } from "./content-mapper.ts";
import { createSvelteFileContext } from "./language.ts";
import { transformSvelte } from "./transformSvelte.ts";

describe("transformSvelte", () => {
	it.each([
		["TypeScript", '<script lang="ts">let count: number = 1;</script>'],
		["JavaScript", "<script>let count = 1;</script>"],
	])("transforms %s script mode", (_, content) => {
		const result = transformSvelte({
			content,
			fileName: "/project/Component.svelte",
			projectHandle: "project",
		});

		expect(result.extension).toBe(".tsx");
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

	it("does not split surrogate pairs when a script contains emoji", () => {
		const content = '<script lang="ts">const emoji = "😀 é";</script>';
		const result = transformSvelte({
			content,
			fileName: "/project/Component.svelte",
			projectHandle: "project",
		});

		const isInsidePair = (text: string, offset: number): boolean =>
			/^[\ud800-\udbff][\udc00-\udfff]$/.test(
				text.slice(offset - 1, offset + 1),
			);
		for (const mapping of result.mappings ?? []) {
			expect(isInsidePair(result.text, mapping[0])).toBe(false);
			expect(isInsidePair(result.text, mapping[0] + mapping[1])).toBe(false);
			expect(isInsidePair(content, mapping[2])).toBe(false);
			expect(isInsidePair(content, mapping[2] + mapping[3])).toBe(false);
		}
		expect(
			result.mappings?.some((mapping) =>
				content.slice(mapping[2], mapping[2] + mapping[3]).includes("😀"),
			),
		).toBe(true);
	});

	it("returns ranged Svelte diagnostics for malformed input", () => {
		const result = transformSvelte({
			content: "<div>",
			fileName: "/project/Broken.svelte",
			projectHandle: "project",
		});

		expect(result.diagnostics).toMatchObject([{ length: 1, start: 0 }]);
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

	it("finds the Svelte config beside the authored tsconfig when opened through a Flint overlay", async () => {
		const projectDirectory = await mkdtemp(
			path.join(tmpdir(), "flint-svelte-mapper-"),
		);
		try {
			const svelteConfigFileName = path.join(
				projectDirectory,
				"svelte.config.js",
			);
			await writeFile(svelteConfigFileName, "export default {};\n");

			const project = await openSvelteProject({
				compilerOptions: {},
				configFileName: path.join(
					projectDirectory,
					"tsconfig.flint-overlay.json",
				),
				projectHandle: "overlay",
			});

			expect(project.watchedFiles).toEqual([svelteConfigFileName]);
		} finally {
			await rm(projectDirectory, { force: true, recursive: true });
		}
	});

	it("reports invalid mapper options through protocol option diagnostics", async () => {
		const project = await openSvelteProject({
			compilerOptions: {},
			configFileName: "/project/tsconfig.json",
			options: { unexpected: true },
			projectHandle: "project",
		});

		expect(project.optionDiagnostics).toEqual([
			{
				messageText: 'Unknown Svelte content mapper option "unexpected".',
				path: ["unexpected"],
			},
		]);
	});
});

describe(createSvelteFileContext, () => {
	it("reports the parse failure when Svelte cannot parse the source", () => {
		const context = createSvelteFileContext(
			"component.svelte",
			"<script>let =</script>",
		);

		expect(context.services.svelte.ast.fragment.nodes).toEqual([]);
		expect(context.directives).toEqual([]);
		expect(context.languageReports).toMatchObject([
			{
				source: "svelte",
				text: expect.stringContaining("component.svelte") as string,
			},
		]);
	});
});
