import { describe, expect, it } from "vitest";

import { transformAstro } from "./content-mapper.ts";

describe(transformAstro, () => {
	it("maps an authored template without overlapping original ranges", () => {
		const result = transformAstro({
			content: "<div>Hello!</div>",
			fileName: "/project/Component.astro",
			projectHandle: "project",
		});

		expect(result.text).toContain("<div>Hello!</div>");
		expect(result.mappings).toHaveLength(1);
		expect(result.mappings?.[0]?.slice(1, 5)).toEqual([17, 0, 17, 0]);
	});

	it("does not return data scripts as supplemental TypeScript", () => {
		const result = transformAstro({
			content: '<script type="application/ld+json">{"name":"Flint"}</script>',
			fileName: "/project/Component.astro",
			projectHandle: "project",
		});

		expect(result.supplemental).toEqual([]);
	});

	it("returns canonical TSX and supplemental authored scripts", () => {
		const content = [
			"---",
			"const title: string = 'Hello';",
			"---",
			"<script>const client: number = 1;</script>",
			"<h1>{title}</h1>",
		].join("\n");
		const result = transformAstro({
			content,
			fileName: "/project/Component.astro",
			projectHandle: "project",
		});

		expect(result.extension).toBe(".tsx");
		expect(result.text).toContain("const title: string");
		expect(result.mappings?.length).toBeGreaterThan(0);
		expect(result.supplemental).toEqual([
			expect.objectContaining({
				extension: ".ts",
				text: "const client: number = 1;",
			}),
		]);
		expect(result.supplemental?.[0]?.mappings).toEqual([
			[0, 25, content.indexOf("const client"), 25, 0],
		]);
	});

	it("returns authored compiler diagnostics", () => {
		const result = transformAstro({
			content: '<div set:html="foo">child</div>',
			fileName: "/project/Broken.astro",
			projectHandle: "project",
		});

		expect(result.diagnostics).toEqual([
			expect.objectContaining({ length: 8, start: 5 }),
		]);
	});
});
