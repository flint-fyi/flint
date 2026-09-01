import path from "node:path";

import { API, JsxEmit } from "typescript-native/unstable/sync";
import { expect, it } from "vitest";

import { nullThrows } from "@flint.fyi/utils";

import { collectReferencedFilePaths } from "./collectReferencedFilePaths.ts";
import type * as AST from "./types/ast.ts";

it("uses checker-resolved declarations for supported module resolution forms", () => {
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
		).sort(),
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
