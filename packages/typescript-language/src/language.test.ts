import { SyntaxKind } from "typescript-native/unstable/ast";
import { API } from "typescript-native/unstable/sync";
import { describe, expect, it } from "vitest";

import { visitTypeScriptNodes } from "./language.ts";
import type * as AST from "./types/ast.ts";

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
