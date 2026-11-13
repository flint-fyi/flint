import ts from "typescript";
import { describe, expect, it } from "vitest";

import type { AST } from "@flint.fyi/typescript-language";

import { parseTestCase, parseTestCaseInvalid } from "./parseTestCases.ts";

function parseExpression(code: string): AST.Expression {
	const sourceFile = ts.createSourceFile(
		"file.ts",
		`const testCase = ${code};`,
		ts.ScriptTarget.Latest,
		true,
	);
	const statement = sourceFile.statements[0];
	if (statement && ts.isVariableStatement(statement)) {
		const initializer = statement.declarationList.declarations[0]?.initializer;
		if (initializer) {
			return initializer as AST.Expression;
		}
	}
	throw new Error("Expected a test case expression.");
}

describe("parseTestCase", () => {
	it("preserves named files written as static template and raw strings", () => {
		const testCase = parseTestCase(
			parseExpression(`{
				files: { "a.ts": \`first\`, "b.ts": String.raw\`second\\n\` },
				name: "named files",
				options: { enabled: true },
			}`),
		);

		expect(testCase).toMatchObject({
			files: { "a.ts": "first", "b.ts": "second\\n" },
			name: "named files",
			options: { enabled: true },
		});
		expect(testCase?.nodes.fileCodes?.["b.ts"]?.kind).toBe(
			ts.SyntaxKind.TaggedTemplateExpression,
		);
		expect(testCase?.code).toBeUndefined();
	});

	it.each([
		`{ files: { "a.ts": dynamicCode } }`,
		`{ files: { "a.ts": "static", ...otherFiles } }`,
		`{ files: { [dynamicName]: "static" } }`,
		`{ code: dynamicCode, files: { "a.ts": "static" } }`,
		`{ code, files: { "a.ts": "static" } }`,
		`{ ...otherSettings, files: { "a.ts": "static" } }`,
		`{ files: { "a.ts": "static" }, ...otherSettings }`,
	])("does not treat a partial files map as a complete case: %s", (code) => {
		expect(parseTestCase(parseExpression(code))).toBeUndefined();
	});

	it("preserves code shorthand with nonstatic auxiliary contents", () => {
		expect(
			parseTestCase(
				parseExpression(`{ code: "code", files: { "config.json": config } }`),
			),
		).toMatchObject({ code: "code" });
	});
});

describe("parseTestCaseInvalid", () => {
	it("pairs snapshots with named source files", () => {
		const testCase = parseTestCaseInvalid(
			parseExpression(`{
				files: { "a.ts": "first", "b.ts": "second" },
				snapshot: { "b.ts": "second report" },
			}`),
		);

		expect(testCase).toMatchObject({
			files: { "a.ts": "first", "b.ts": "second" },
			snapshot: { "b.ts": "second report" },
		});
		expect(testCase?.nodes.snapshotFiles?.["b.ts"]?.getText()).toBe(
			'"second report"',
		);
	});

	it("accepts a string snapshot for one named file", () => {
		expect(
			parseTestCaseInvalid(
				parseExpression(`{ files: { "a.ts": "code" }, snapshot: "report" }`),
			),
		).toMatchObject({ files: { "a.ts": "code" }, snapshot: "report" });
	});

	it("keeps auxiliary files separate from code shorthand", () => {
		expect(
			parseTestCaseInvalid(
				parseExpression(`{
					code: "code",
					files: { "config.json": "{}" },
					snapshot: "report",
				}`),
			),
		).toMatchObject({
			code: "code",
			files: { "config.json": "{}" },
			snapshot: "report",
		});
	});
});
