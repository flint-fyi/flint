import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { transformAstro } from "./content-mapper.ts";

describe(transformAstro, () => {
	it("imports Astro's ambient type files when astro is installed for the component", async () => {
		const projectDirectory = await mkdtemp(
			path.join(tmpdir(), "flint-astro-mapper-"),
		);
		try {
			const astroDirectory = path.join(projectDirectory, "node_modules/astro");
			await mkdir(astroDirectory, { recursive: true });
			await writeFile(
				path.join(astroDirectory, "package.json"),
				JSON.stringify({ name: "astro" }),
			);
			await writeFile(path.join(astroDirectory, "env.d.ts"), "");
			await writeFile(path.join(astroDirectory, "astro-jsx.d.ts"), "");

			const result = transformAstro({
				content: "<div>Hello!</div>",
				fileName: path.join(projectDirectory, "src/Component.astro"),
				projectHandle: "project",
			});

			expect(result.text).toContain(
				`import ${JSON.stringify(path.join(astroDirectory, "env.d.ts"))};`,
			);
			expect(result.text).toContain(
				`import ${JSON.stringify(path.join(astroDirectory, "astro-jsx.d.ts"))};`,
			);
			expect(result.mappings?.[0]?.slice(1, 5)).toEqual([17, 0, 17, 0]);
		} finally {
			await rm(projectDirectory, { force: true, recursive: true });
		}
	});

	it("omits Astro's ambient type files when astro is not installed for the component", () => {
		const result = transformAstro({
			content: "<div>Hello!</div>",
			fileName: "/project/Component.astro",
			projectHandle: "project",
		});

		expect(result.text).not.toContain("astro-jsx.d.ts");
		expect(result.text).not.toContain("env.d.ts");
	});

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
		expect(result.supplemental).toMatchObject([
			{ extension: ".ts", text: "const client: number = 1;" },
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

		expect(result.diagnostics).toMatchObject([{ length: 8, start: 5 }]);
	});
});
