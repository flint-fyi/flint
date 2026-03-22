import { createVFSLinterHost } from "@flint.fyi/core";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import { collectReferencedFilePaths } from "./collectReferencedFilePaths.ts";
import type * as AST from "./types/ast.ts";

describe("collectReferencedFilePaths", () => {
	it("includes package-like imports that resolve to workspace sources", () => {
		const root = "/repo/packages/app";
		const linterHost = createVFSLinterHost({ caseSensitive: true, cwd: root });
		linterHost.vfsUpsertFile(
			"/repo/packages/app/src/index.ts",
			`import { value } from "pkg"; void value;`,
		);
		linterHost.vfsUpsertFile(
			"/repo/packages/pkg/src/index.ts",
			`export const value = 1;`,
		);
		const entryFilePath = "/repo/packages/app/src/index.ts";
		const program = createProgram(
			entryFilePath,
			createCompilerHost(linterHost),
			{
				baseUrl: "/repo/packages/app",
				paths: {
					pkg: ["../pkg/src/index.ts"],
				},
			},
		);
		const sourceFile = program.getSourceFile(entryFilePath) as AST.SourceFile;

		const actual = collectReferencedFilePaths(
			createModuleResolutionHost(linterHost),
			program,
			sourceFile,
		);

		expect(actual).toEqual(["../pkg/src/index.ts"]);
	});

	it("excludes true external libraries", () => {
		const linterHost = createVFSLinterHost({
			caseSensitive: true,
			cwd: "/repo",
		});
		linterHost.vfsUpsertFile(
			"/repo/src/index.ts",
			`import { camelCase } from "lodash"; void camelCase;`,
		);
		linterHost.vfsUpsertFile(
			"/repo/node_modules/lodash/package.json",
			JSON.stringify({ name: "lodash", types: "./index.d.ts" }),
		);
		linterHost.vfsUpsertFile(
			"/repo/node_modules/lodash/index.d.ts",
			`export declare function camelCase(value: string): string;`,
		);

		const entryFilePath = "/repo/src/index.ts";
		const program = createProgram(
			entryFilePath,
			createCompilerHost(linterHost),
		);
		const sourceFile = program.getSourceFile(entryFilePath) as AST.SourceFile;

		const actual = collectReferencedFilePaths(
			createModuleResolutionHost(linterHost),
			program,
			sourceFile,
		);

		expect(actual).toEqual([]);
	});
});

function createCompilerHost(
	linterHost: ReturnType<typeof createVFSLinterHost>,
): ts.CompilerHost {
	const options: ts.CompilerOptions = {
		module: ts.ModuleKind.NodeNext,
		moduleResolution: ts.ModuleResolutionKind.NodeNext,
		noEmit: true,
		target: ts.ScriptTarget.ESNext,
	};
	const useCaseSensitiveFileNames = linterHost.isCaseSensitiveFS();
	const compilerHost = ts.createCompilerHost(options);

	return {
		...compilerHost,
		directoryExists: (directoryPath) =>
			linterHost.fileTypeSync(resolveFromCwd(linterHost, directoryPath)) ===
			"directory",
		fileExists: (filePath) =>
			linterHost.fileTypeSync(resolveFromCwd(linterHost, filePath)) === "file",
		getCurrentDirectory: () => linterHost.getCurrentDirectory(),
		getSourceFile(fileName, languageVersionOrOptions) {
			const sourceText = linterHost.readFileSync(
				resolveFromCwd(linterHost, fileName),
			);
			if (sourceText == null) {
				return undefined;
			}
			return ts.createSourceFile(
				fileName,
				sourceText,
				languageVersionOrOptions,
				true,
			);
		},
		readFile: (filePath) =>
			linterHost.readFileSync(resolveFromCwd(linterHost, filePath)),
		useCaseSensitiveFileNames: () => useCaseSensitiveFileNames,
	};
}

function createModuleResolutionHost(
	linterHost: ReturnType<typeof createVFSLinterHost>,
): ts.ModuleResolutionHost {
	return {
		directoryExists: (directoryPath) =>
			linterHost.fileTypeSync(resolveFromCwd(linterHost, directoryPath)) ===
			"directory",
		fileExists: (filePath) =>
			linterHost.fileTypeSync(resolveFromCwd(linterHost, filePath)) === "file",
		getCurrentDirectory: () => linterHost.getCurrentDirectory(),
		readFile: (filePath) =>
			linterHost.readFileSync(resolveFromCwd(linterHost, filePath)),
		useCaseSensitiveFileNames: () => linterHost.isCaseSensitiveFS(),
	};
}

function createProgram(
	entryFilePath: string,
	host: ts.CompilerHost,
	compilerOptions: ts.CompilerOptions = {},
) {
	return ts.createProgram({
		host,
		options: {
			...compilerOptions,
			module: ts.ModuleKind.NodeNext,
			moduleResolution: ts.ModuleResolutionKind.NodeNext,
			noEmit: true,
			target: ts.ScriptTarget.ESNext,
		},
		rootNames: [entryFilePath],
	});
}

function resolveFromCwd(
	linterHost: ReturnType<typeof createVFSLinterHost>,
	filePath: string,
) {
	return path.resolve(linterHost.getCurrentDirectory(), filePath);
}
