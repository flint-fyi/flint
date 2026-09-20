import path from "node:path";

import { API, JsxEmit } from "typescript-native/unstable/sync";
import { describe, expect, it, vi } from "vitest";

import { nullThrows } from "@flint.fyi/utils";

import { collectReferencedFilePaths } from "./collectReferencedFilePaths.ts";
import type * as AST from "./types/ast.ts";

describe(collectReferencedFilePaths, () => {
	it("uses typeChecker-resolved declarations for supported module resolution forms", () => {
		const files = new Map([
			["/repo/node_modules/external/index.d.ts", "export {};"],
			["/repo/node_modules/external/package.json", '{"types":"index.d.ts"}'],
			["/repo/src/aliased.ts", "export {};"],
			["/repo/src/data.json", "{}"],
			["/repo/src/directory/index.ts", "export {};"],
			[
				"/repo/src/index.ts",
				[
					'import "@alias/path";',
					'import "./substituted.js";',
					'import data from "./data.json";',
					'import("./directory");',
					'type Declaration = import("./types.d.mts");',
					'import "external";',
				].join("\n"),
			],
			["/repo/src/substituted.ts", "export {};"],
			["/repo/src/types.d.mts", "export {};"],
		]);
		const api = new API({
			cwd: "/repo",
			fs: {
				directoryExists: (directoryName) =>
					[...files].some(([fileName]) =>
						fileName.startsWith(`${directoryName}/`),
					),
				fileExists: (fileName) => files.has(fileName),
				getAccessibleEntries: (directoryName) => {
					const entries = [...files]
						.map(([fileName]) => path.relative(directoryName, fileName))
						.filter((fileName) => !fileName.startsWith(".."));
					return {
						directories: entries
							.filter((fileName) => fileName.includes("/"))
							.map((fileName) => fileName.slice(0, fileName.indexOf("/"))),
						files: entries.filter((fileName) => !fileName.includes("/")),
					};
				},
				readFile: (fileName) => files.get(fileName) ?? null,
			},
		});
		const program = api.createProgram(["/repo/src/index.ts"], {
			compilerOptions: {
				allowJs: true,
				jsx: JsxEmit.Preserve,
				moduleResolution: 2,
				paths: { "@alias/*": ["src/aliased.ts"] },
				resolveJsonModule: true,
			},
		});
		const sourceFile = nullThrows(
			program.getSourceFile("/repo/src/index.ts"),
			"Expected the program source file.",
		) as unknown as AST.SourceFile;

		expect(
			collectReferencedFilePaths(
				program,
				program.getProject().checker,
				sourceFile,
			).toSorted(),
		).toEqual(
			[
				"/repo/src/aliased.ts",
				"/repo/src/data.json",
				"/repo/src/directory/index.ts",
				"/repo/src/substituted.ts",
				"/repo/src/types.d.mts",
			].map((fileName) => path.relative(process.cwd(), fileName)),
		);

		program.dispose();
	});

	it("reports root files without asking the native process about them", () => {
		const files = new Map([
			["/repo/src/index.ts", 'export * from "./root";\nimport "./loose";'],
			["/repo/src/loose.ts", "export {};"],
			["/repo/src/root.ts", "export const root = 1;"],
		]);
		const api = new API({
			cwd: "/repo",
			fs: {
				directoryExists: (directoryName) =>
					[...files].some(([fileName]) =>
						fileName.startsWith(`${directoryName}/`),
					),
				fileExists: (fileName) => files.has(fileName),
				readFile: (fileName) => files.get(fileName) ?? null,
			},
		});
		const program = api.createProgram(
			["/repo/src/index.ts", "/repo/src/root.ts"],
			{
				compilerOptions: { noLib: true },
			},
		);
		const sourceFile = nullThrows(
			program.getSourceFile("/repo/src/index.ts"),
			"Expected the program source file.",
		) as unknown as AST.SourceFile;
		// The program's methods are lazily defined getters, which `vi.spyOn`
		// cannot replace, so observe calls through an inheriting object instead.
		const metadataSpy = vi.fn(program.getSourceFileMetadataByPath);
		const observed = Object.create(program, {
			getSourceFileMetadataByPath: { value: metadataSpy },
		}) as typeof program;

		expect(
			collectReferencedFilePaths(
				observed,
				program.getProject().checker,
				sourceFile,
			).toSorted(),
		).toEqual(
			["/repo/src/loose.ts", "/repo/src/root.ts"].map((fileName) =>
				path.relative(process.cwd(), fileName),
			),
		);
		// Only the file that is not a root needed its metadata.
		expect(metadataSpy).toHaveBeenCalledExactlyOnceWith("/repo/src/loose.ts");

		program.dispose();
	});
});
