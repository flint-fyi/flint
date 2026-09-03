import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";

import { collectReferencedFilePaths } from "./collectReferencedFilePaths.ts";
import type * as AST from "./types/ast.ts";

const tempDirectories: string[] = [];

describe(collectReferencedFilePaths, () => {
	afterEach(async () => {
		await Promise.all(
			tempDirectories
				.splice(0)
				.map((dir) => rm(dir, { force: true, recursive: true })),
		);
	});

	it("includes imports, import types, dynamic imports, and re-exports", async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), "flint-ts-deps-"));
		tempDirectories.push(root);

		const indexPath = path.join(root, "index.ts");
		const dependencyNames = [
			"imported",
			"dynamic",
			"awaited",
			"typed",
			"exported",
			"export-all",
		];

		await Promise.all([
			writeFile(
				indexPath,
				`
					import { imported } from "./imported";
					void import("./dynamic");
					await import("./awaited");
					type Typed = import("./typed").Typed;
					export { exported } from "./exported";
					export * from "./export-all";
				`,
			),
			...dependencyNames.map((name) =>
				writeFile(path.join(root, `${name}.ts`), "export const value = 1;"),
			),
		]);

		const program = ts.createProgram([indexPath], {
			allowJs: true,
			module: ts.ModuleKind.NodeNext,
			moduleResolution: ts.ModuleResolutionKind.NodeNext,
			target: ts.ScriptTarget.ESNext,
		});
		const sourceFile = program.getSourceFile(indexPath);

		expect(sourceFile).toBeDefined();
		expect(
			new Set(
				collectReferencedFilePaths(program, sourceFile as AST.SourceFile).map(
					(filePath) => path.basename(filePath, ".ts"),
				),
			),
		).toEqual(new Set(dependencyNames));
	});
});
