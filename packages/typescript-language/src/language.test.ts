import { SyntaxKind } from "typescript-native/unstable/ast";
import { API } from "typescript-native/unstable/sync";
import { describe, expect, it } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import { typescriptLanguage, visitTypeScriptNodes } from "./language.ts";
import type * as AST from "./types/ast.ts";

describe("typescriptLanguage file lifecycle", () => {
	it("keeps every file on the final snapshot until LIFO finalization", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile(
			"/repo/tsconfig.json",
			JSON.stringify({
				compilerOptions: { noLib: true },
				files: ["first.ts", "second.ts"],
			}),
		);
		host.vfsUpsertFile("/repo/first.ts", "export const first = 1;");
		host.vfsUpsertFile("/repo/second.ts", "export const second = 2;");
		const factory = typescriptLanguage.createFileFactory(host);
		const first = factory.createFile({
			filePath: "/repo/first.ts",
			filePathAbsolute: "/repo/first.ts",
			sourceText: "export const first = 1;",
		});
		const firstSnapshot = first.services.snapshot;
		const second = factory.createFile({
			filePath: "/repo/second.ts",
			filePathAbsolute: "/repo/second.ts",
			sourceText: "export const second = 2;",
		});

		expect(first.services.snapshot).not.toBe(firstSnapshot);
		expect(first.services.snapshot).toBe(second.services.snapshot);
		expect(first.services.sourceFile.fileName).toBe("/repo/first.ts");
		expect(second.services.sourceFile.fileName).toBe("/repo/second.ts");
		expect(first.services.project).toBeDefined();
		expect(first.services.program).toBeDefined();
		expect(first.services.checker).toBeDefined();
		expect(first.services.typeChecker).toBe(first.services.checker);

		second[Symbol.dispose]();
		expect(first.services.sourceFile.fileName).toBe("/repo/first.ts");
		first[Symbol.dispose]();
		expect(first.services.snapshot).toBeDefined();
		factory[Symbol.dispose]();
		expect(() => first.services.snapshot).toThrow("disposed");
	});

	it("updates a repeated target file after a zero-active-file gap", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile(
			"/repo/index.ts",
			'location.href = "javascript:void(0)";',
		);
		const factory = typescriptLanguage.createFileFactory(host);
		const first = factory.createFile({
			filePath: "/repo/index.ts",
			filePathAbsolute: "/repo/index.ts",
			sourceText: 'location.href = "javascript:void(0)";',
		});
		expect(first.services.sourceFile.statements[0]?.kind).toBe(
			SyntaxKind.ExpressionStatement,
		);
		first[Symbol.dispose]();

		host.vfsUpsertFile("/repo/index.ts", "export const value = 2;");
		const second = factory.createFile({
			filePath: "/repo/index.ts",
			filePathAbsolute: "/repo/index.ts",
			sourceText: "export const value = 2;",
		});
		expect(second.services.sourceFile.text).toContain("value = 2");
		expect(second.services.sourceFile.statements[0]?.kind).toBe(
			SyntaxKind.VariableStatement,
		);
		second[Symbol.dispose]();
		factory[Symbol.dispose]();
	});

	it("updates created, changed, and deleted auxiliary project files", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/index.ts", 'import "./auxiliary";');
		const factory = typescriptLanguage.createFileFactory(host);
		const createTarget = () =>
			factory.createFile({
				filePath: "/repo/index.ts",
				filePathAbsolute: "/repo/index.ts",
				sourceText: 'import "./auxiliary";',
			});
		const first = createTarget();
		expect(
			first.services.program.getSourceFile("/repo/auxiliary.ts"),
		).toBeUndefined();
		first[Symbol.dispose]();

		host.vfsUpsertFile("/repo/auxiliary.ts", "export const value = 1;");
		const second = createTarget();
		expect(
			second.services.program.getSourceFile("/repo/auxiliary.ts")?.text,
		).toContain("value = 1");
		second[Symbol.dispose]();

		host.vfsUpsertFile("/repo/auxiliary.ts", "export const value = 2;");
		const third = createTarget();
		expect(
			third.services.program.getSourceFile("/repo/auxiliary.ts")?.text,
		).toContain("value = 2");
		third[Symbol.dispose]();

		host.vfsDeleteFile("/repo/auxiliary.ts");
		const fourth = createTarget();
		expect(
			fourth.services.program.getSourceFile("/repo/auxiliary.ts"),
		).toBeUndefined();
		fourth[Symbol.dispose]();
		factory[Symbol.dispose]();
	});
});

describe("visitTypeScriptNodes", () => {
	it("visits native nodes in enter and exit order", () => {
		const api = new API({
			cwd: "/repo",
			fs: {
				fileExists: (fileName) => fileName === "/repo/index.ts",
				readFile: (fileName) =>
					fileName === "/repo/index.ts" ? "let value;" : null,
			},
		});
		const program = api.createProgram(["/repo/index.ts"], {
			compilerOptions: { noLib: true },
		});
		const sourceFile = program.getSourceFile("/repo/index.ts");

		try {
			expect(sourceFile).toBeDefined();
			if (!sourceFile) {
				throw new Error("Expected the native program to contain index.ts.");
			}
			const events: string[] = [];
			visitTypeScriptNodes(
				sourceFile,
				{
					Identifier: (node) => {
						expect(node.text).toBe("value");
						events.push("Identifier");
					},
					"Identifier:exit": () => events.push("Identifier:exit"),
					SourceFile: () => events.push("SourceFile"),
					"SourceFile:exit": () => events.push("SourceFile:exit"),
					VariableDeclaration: () => events.push("VariableDeclaration"),
					"VariableDeclaration:exit": () =>
						events.push("VariableDeclaration:exit"),
					VariableDeclarationList: () => events.push("VariableDeclarationList"),
					"VariableDeclarationList:exit": () =>
						events.push("VariableDeclarationList:exit"),
					VariableStatement: () => events.push("VariableStatement"),
					"VariableStatement:exit": () => events.push("VariableStatement:exit"),
				},
				{},
			);

			expect(events).toEqual([
				"SourceFile",
				"VariableStatement",
				"VariableDeclarationList",
				"VariableDeclaration",
				"Identifier",
				"Identifier:exit",
				"VariableDeclaration:exit",
				"VariableDeclarationList:exit",
				"VariableStatement:exit",
				"SourceFile:exit",
			]);
		} finally {
			program.dispose();
			api.close();
		}
	});

	it("traverses children without callbacks for unknown syntax kinds", () => {
		const events: string[] = [];
		const sourceFile = {
			forEachChild(visitor: (node: unknown) => void) {
				visitor({
					forEachChild(childVisitor: (node: unknown) => void) {
						childVisitor({
							forEachChild(): undefined {
								return undefined;
							},
							kind: SyntaxKind.Identifier,
						});
					},
					kind: Number.MAX_SAFE_INTEGER,
				});
			},
			kind: SyntaxKind.SourceFile,
		};
		const visitors = {
			Identifier: () => events.push("Identifier"),
			"Identifier:exit": () => events.push("Identifier:exit"),
			SourceFile: () => events.push("SourceFile"),
			"SourceFile:exit": () => events.push("SourceFile:exit"),
			undefined: () => events.push("unknown"),
			"undefined:exit": () => events.push("unknown:exit"),
		};

		visitTypeScriptNodes(sourceFile as unknown as AST.SourceFile, visitors, {});

		expect(events).toEqual([
			"SourceFile",
			"Identifier",
			"Identifier:exit",
			"SourceFile:exit",
		]);
	});
});
