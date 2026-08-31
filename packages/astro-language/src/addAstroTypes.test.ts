import typescript from "typescript";
import { describe, expect, it, vi } from "vitest";

import { addAstroTypes } from "./addAstroTypes.ts";

describe(addAstroTypes, () => {
	it("adds resolved Astro type files to the program roots", () => {
		const compilerOptions: typescript.CompilerOptions = {};
		const cache = typescript.createModuleResolutionCache(
			"/",
			(fileName) => fileName,
			compilerOptions,
		);
		const host = {
			...typescript.createCompilerHost(compilerOptions),
			getModuleResolutionCache: () => cache,
		};
		const resolveModuleName = vi.fn<typeof typescript.resolveModuleName>(
			(moduleName) => ({
				resolvedModule: {
					extension: typescript.Extension.Dts,
					isExternalLibraryImport: true,
					resolvedFileName: `/node_modules/${moduleName}.d.ts`,
				},
			}),
		);
		const options: typescript.CreateProgramOptions = {
			host,
			options: compilerOptions,
			rootNames: ["file.astro"],
		};

		addAstroTypes({ ...typescript, resolveModuleName }, options);

		expect(resolveModuleName.mock.calls).toEqual([
			["astro/env", "file.astro", compilerOptions, host, cache],
			["astro/astro-jsx", "file.astro", compilerOptions, host, cache],
		]);
		expect(options.rootNames).toEqual([
			"file.astro",
			"/node_modules/astro/env.d.ts",
			"/node_modules/astro/astro-jsx.d.ts",
		]);
	});

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
