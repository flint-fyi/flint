import {
	mkdir,
	mkdtemp,
	realpath,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { normalize } from "pathe";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";

import { createDiskBackedLinterHost } from "@flint.fyi/core/node";

import { collectReferencedFilePaths } from "./collectReferencedFilePaths.ts";
import { createTypeScriptServerHost } from "./createTypeScriptServerHost.ts";
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
				collectReferencedFilePaths(
					program,
					sourceFile as AST.SourceFile,
					createTypeScriptServerHost(createDiskBackedLinterHost(root)),
				),
			),
		).toEqual(
			new Set(
				dependencyNames.map((name) => normalize(path.join(root, `${name}.ts`))),
			),
		);
	});

	it("includes workspace packages linked through node_modules, but not installed packages", async () => {
		const root = await realpath(
			await mkdtemp(path.join(os.tmpdir(), "flint-ts-deps-")),
		);
		tempDirectories.push(root);

		const files = {
			"packages/app/index.ts":
				'import { installed } from "installed";\nimport { linked } from "linked";\n',
			"packages/app/node_modules/installed/index.d.ts":
				"export declare const installed: number;\n",
			"packages/app/node_modules/installed/package.json": JSON.stringify({
				name: "installed",
				types: "./index.d.ts",
			}),
			"packages/linked/package.json": JSON.stringify({
				exports: "./src/index.ts",
				name: "linked",
			}),
			"packages/linked/src/index.ts": "export const linked = 1;\n",
		};
		await Promise.all(
			Object.entries(files).map(async ([filePath, content]) => {
				await mkdir(path.dirname(path.join(root, filePath)), {
					recursive: true,
				});
				await writeFile(path.join(root, filePath), content);
			}),
		);
		await symlink(
			path.join(root, "packages/linked"),
			path.join(root, "packages/app/node_modules/linked"),
			"dir",
		);

		const indexPath = path.join(root, "packages/app/index.ts");
		const program = ts.createProgram([indexPath], {
			module: ts.ModuleKind.NodeNext,
			moduleResolution: ts.ModuleResolutionKind.NodeNext,
			target: ts.ScriptTarget.ESNext,
		});

		const dependencies = collectReferencedFilePaths(
			program,
			program.getSourceFile(indexPath) as AST.SourceFile,
			createTypeScriptServerHost(createDiskBackedLinterHost(root)),
		);

		expect(dependencies).toContain(
			normalize(path.join(root, "packages/linked/src/index.ts")),
		);
		expect(dependencies).not.toContain(
			normalize(
				path.join(root, "packages/app/node_modules/installed/index.d.ts"),
			),
		);
	});
});
