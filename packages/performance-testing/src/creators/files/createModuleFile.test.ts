import { describe, expect, it } from "vitest";

import { createModuleCycle } from "./createModuleFile.ts";

describe(createModuleCycle, () => {
	it("creates two of each module kind in a repeating pattern when called repeatedly", () => {
		const createModule = createModuleCycle();
		const kindMarkers = [
			["superSimple", "return { total: prefix.length"],
			["simple", "formatEntry"],
			["generic", "class Cache"],
			["result", "applyEvent"],
			["complex", "class Repository"],
		] as const;

		const actual = Array.from({ length: 12 }, (_, index) => {
			const source = createModule(index);
			return kindMarkers.find(([, marker]) => source.includes(marker))?.[0];
		});

		expect(actual).toEqual([
			"superSimple",
			"superSimple",
			"simple",
			"simple",
			"generic",
			"generic",
			"result",
			"result",
			"complex",
			"complex",
			"superSimple",
			"superSimple",
		]);
	});

	it("exports an example function resolving to a summary when creating each module kind", () => {
		const createModule = createModuleCycle();

		const actual = Array.from({ length: 10 }, (_, index) =>
			createModule(index),
		);

		expect(
			actual.every(
				(source, index) =>
					source.includes(`export interface Summary${index} {`) &&
					source.includes(
						`export async function example${index}(prefix: string): Promise<Summary${index}> {`,
					),
			),
		).toBe(true);
	});

	it("imports and awaits each dependency when given dependencies", () => {
		const createModule = createModuleCycle();
		createModule(0);
		createModule(1);

		const actual = createModule(5, [
			{ index: 0, path: "./nested1/index.ts" },
			{ index: 1, path: "./nested2/index.ts" },
		]);

		expect(actual).toContain(
			`import { example0, type Summary0 } from "./nested1/index.ts";`,
		);
		expect(actual).toContain(
			`import { example1, type Summary1 } from "./nested2/index.ts";`,
		);
		expect(actual).toContain(
			"const dependencySummaries: [Summary0, Summary1] = await Promise.all([example0(prefix), example1(prefix)]);",
		);
	});

	it("does not import anything when given no dependencies", () => {
		const createModule = createModuleCycle();
		createModule(0);
		createModule(1);

		const actual = createModule(2);

		expect({
			hasImports: actual.includes("import "),
			hasZeroTotal: actual.includes("const dependencyTotal = 0;"),
		}).toEqual({ hasImports: false, hasZeroTotal: true });
	});
});
