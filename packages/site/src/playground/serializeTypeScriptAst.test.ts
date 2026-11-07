import typescript from "typescript";
import { describe, expect, it } from "vitest";

import { serializeTypeScriptAst } from "./serializeTypeScriptAst.ts";

function createSourceFile(code: string): typescript.SourceFile {
	return typescript.createSourceFile(
		"index.ts",
		code,
		typescript.ScriptTarget.Latest,
		true,
	);
}

describe(serializeTypeScriptAst, () => {
	it("serializes child nodes and node arrays under their property names", () => {
		const sourceFile = createSourceFile("const value = 1;");

		const ast = serializeTypeScriptAst(sourceFile, sourceFile);

		expect(ast).toEqual({
			end: 16,
			kind: "SourceFile",
			properties: {
				endOfFileToken: {
					end: 16,
					kind: "EndOfFileToken",
					properties: {},
					start: 16,
				},
				statements: [
					{
						end: 16,
						kind: "VariableStatement",
						properties: {
							declarationList: {
								end: 15,
								kind: "VariableDeclarationList",
								properties: {
									declarations: [
										{
											end: 15,
											kind: "VariableDeclaration",
											properties: {
												initializer: {
													end: 15,
													kind: "NumericLiteral",
													properties: {},
													start: 14,
													text: "1",
												},
												name: {
													end: 11,
													kind: "Identifier",
													properties: {},
													start: 6,
													text: "value",
												},
											},
											start: 6,
										},
									],
								},
								start: 0,
							},
						},
						start: 0,
					},
				],
			},
			start: 0,
		});
	});

	it("uses real syntax kind names instead of marker aliases", () => {
		const sourceFile = createSourceFile("let value;");

		const ast = serializeTypeScriptAst(sourceFile, sourceFile);

		expect(ast.properties.statements).toMatchObject([
			{ kind: "VariableStatement" },
		]);
	});
});
