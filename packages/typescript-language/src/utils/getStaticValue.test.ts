import ts from "typescript";
import { describe, expect, it } from "vitest";

import type * as AST from "../types/ast.ts";
import {
	getStaticNumberValue,
	getStaticStringValue,
	getStaticValue,
} from "./getStaticValue.ts";

describe(getStaticValue, () => {
	it.each([
		{ source: '"abc"', value: "abc" },
		{ source: "`abc`", value: "abc" },
		{ source: "123", value: 123 },
		{ source: "1n", value: 1n },
		{ source: "true", value: true },
		{ source: "false", value: false },
		{ source: "null", value: null },
	])("returns literal value for $source", ({ source, value }) => {
		expect(getStaticValue(parseExpression(source))?.value).toBe(value);
	});

	it.each([
		{ source: "-1", value: -1 },
		{ source: "+1", value: 1 },
		{ source: "~1", value: -2 },
		{ source: "!true", value: false },
		{ source: "-1n", value: -1n },
		{ source: "~1n", value: -2n },
		{ source: "-0", value: -0 },
	])("returns unary expression value for $source", ({ source, value }) => {
		expect(getStaticValue(parseExpression(source))?.value).toBe(value);
	});

	it.each([
		{ source: "(1)", value: 1 },
		{ source: "1 as number", value: 1 },
		{ source: "1 satisfies number", value: 1 },
		{ source: "'abc'!", value: "abc" },
		{ source: "<number>1", value: 1 },
	])("unwraps value-preserving expression for $source", ({ source, value }) => {
		expect(getStaticValue(parseExpression(source))?.value).toBe(value);
	});

	it.each([
		"undefined",
		"call()",
		"member.value",
		"`${value}`",
		"+1n",
		"-'1'",
		"1 + 2",
	])("returns undefined for non-static expression %s", (source) => {
		expect(getStaticValue(parseExpression(source))).toBeUndefined();
	});
});

describe(getStaticNumberValue, () => {
	it("returns static number values", () => {
		expect(getStaticNumberValue(parseExpression("123"))).toBe(123);
		expect(Object.is(getStaticNumberValue(parseExpression("-0")), -0)).toBe(
			true,
		);
	});

	it("returns undefined for non-number values", () => {
		expect(getStaticNumberValue(parseExpression('"abc"'))).toBeUndefined();
	});
});

describe(getStaticStringValue, () => {
	it("returns static string values", () => {
		expect(getStaticStringValue(parseExpression('"abc"'))).toBe("abc");
		expect(getStaticStringValue(parseExpression("`abc`"))).toBe("abc");
	});

	it("returns undefined for non-string values", () => {
		expect(getStaticStringValue(parseExpression("123"))).toBeUndefined();
	});
});

function parseExpression(source: string): AST.Expression {
	const sourceFile = ts.createSourceFile(
		"getStaticValue.test.ts",
		`const value = ${source};`,
		ts.ScriptTarget.ESNext,
		true,
		ts.ScriptKind.TS,
	);
	const statement = sourceFile.statements[0];
	if (statement?.kind !== ts.SyntaxKind.VariableStatement) {
		throw new Error(`Could not parse expression: ${source}`);
	}

	const initializer = (statement as ts.VariableStatement).declarationList
		.declarations[0]?.initializer;
	if (!initializer) {
		throw new Error(`Could not parse expression: ${source}`);
	}

	return initializer as AST.Expression;
}
