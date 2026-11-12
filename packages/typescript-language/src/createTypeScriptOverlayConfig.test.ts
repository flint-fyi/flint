import { describe, expect, it } from "vitest";

import { createTypeScriptOverlayConfig } from "./createTypeScriptOverlayConfig.ts";

describe(createTypeScriptOverlayConfig, () => {
	it("extends the authored config and resolves copied reference paths", () => {
		const configFilePath = "/repo/packages/app/tsconfig.json";
		const authoredConfig = {
			compilerOptions: { strict: true },
			include: ["src"],
			references: [{ path: "../core" }, { path: "/shared/types" }],
		};

		const overlay = createTypeScriptOverlayConfig(
			configFilePath,
			authoredConfig,
			[
				{
					extensions: [".vue"],
					options: { optionsApi: false },
					packageName: "vize",
				},
			],
		);

		expect(overlay.filePath).toBe(
			"/repo/packages/app/tsconfig.flint-overlay.json",
		);
		expect(JSON.parse(overlay.sourceText)).toEqual({
			contentMappers: [
				{
					extensions: [".vue"],
					options: { optionsApi: false },
					package: "vize",
				},
			],
			extends: configFilePath,
			references: [{ path: "/repo/packages/core" }, { path: "/shared/types" }],
		});
		expect(
			createTypeScriptOverlayConfig(configFilePath, authoredConfig, [])
				.filePath,
		).toBe(overlay.filePath);
	});

	it("names the overlay after the authored config when the config is not tsconfig.json", () => {
		expect(
			createTypeScriptOverlayConfig("/repo/tsconfig.build.json", {}, [])
				.filePath,
		).toBe("/repo/tsconfig.build.flint-overlay.json");
	});

	it("adds mapped files to solution-style configs", () => {
		const overlay = createTypeScriptOverlayConfig(
			"/repo/tsconfig.json",
			{ files: [], references: [{ path: "./package" }] },
			[],
			["/repo/package/Component.svelte"],
		);

		expect(JSON.parse(overlay.sourceText)).toEqual({
			contentMappers: [],
			extends: "/repo/tsconfig.json",
			files: ["/repo/package/Component.svelte"],
			references: [{ path: "/repo/package" }],
		});
	});

	it("rejects malformed references with an actionable config error", () => {
		expect(() =>
			createTypeScriptOverlayConfig(
				"/repo/tsconfig.json",
				{ references: {} },
				[],
			),
		).toThrow("TypeScript config references must be an array");
	});

	it.each([undefined, null, true, 1, "config", []])(
		"rejects a non-object authored config: %j",
		(authoredConfig) => {
			expect(() =>
				createTypeScriptOverlayConfig(
					"/repo/tsconfig.json",
					authoredConfig,
					[],
				),
			).toThrow("TypeScript config must be an object");
		},
	);
});
