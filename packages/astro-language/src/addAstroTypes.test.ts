import typescript from "typescript";
import { describe, expect, it, vi } from "vitest";

import { addAstroTypes } from "./addAstroTypes.ts";

describe(addAstroTypes, () => {
	it("skips programs without Astro root files", () => {
		const resolveModuleName = vi.fn<typeof typescript.resolveModuleName>();
		const options: typescript.CreateProgramOptions = {
			options: {},
			rootNames: ["file.ts"],
		};

		addAstroTypes({ ...typescript, resolveModuleName }, options);

		expect(resolveModuleName).not.toHaveBeenCalled();
		expect(options.rootNames).toEqual(["file.ts"]);
	});

	it("uses the TypeScript system host without a compiler host", () => {
		const resolveModuleName = vi.fn<typeof typescript.resolveModuleName>(
			() => ({
				resolvedModule: undefined,
			}),
		);
		const options: typescript.CreateProgramOptions = {
			options: {},
			rootNames: ["file.astro"],
		};

		addAstroTypes({ ...typescript, resolveModuleName }, options);

		expect(resolveModuleName.mock.calls).toEqual([
			["astro/env", "file.astro", options.options, typescript.sys, undefined],
			[
				"astro/astro-jsx",
				"file.astro",
				options.options,
				typescript.sys,
				undefined,
			],
		]);
		expect(options.rootNames).toEqual(["file.astro"]);
	});
});
