import ts from "typescript";
import { describe, expect, it } from "vitest";

import type * as AST from "../types/ast.ts";
import {
	getStaticNumberValue,
	getStaticStringValue,
	getStaticValue,
} from "./getStaticValue.ts";

describe(getStaticValue, () => {
	it("returns literal values", () => {
		expect(getStaticValue(parseExpression('"abc"'))?.value).toBe("abc");
		expect(getStaticValue(parseExpression("`abc`"))?.value).toBe("abc");
		expect(getStaticValue(parseExpression("123"))?.value).toBe(123);
		expect(getStaticValue(parseExpression("1n"))?.value).toBe(1n);
		expect(getStaticValue(parseExpression("true"))?.value).toBe(true);
		expect(getStaticValue(parseExpression("false"))?.value).toBe(false);
		expect(getStaticValue(parseExpression("null"))?.value).toBe(null);
	});

	it("returns unary expression values", () => {
		expect(getStaticValue(parseExpression("-1"))?.value).toBe(-1);
		expect(getStaticValue(parseExpression("+1"))?.value).toBe(1);
		expect(getStaticValue(parseExpression("~1"))?.value).toBe(-2);
		expect(getStaticValue(parseExpression("!true"))?.value).toBe(false);
		expect(getStaticValue(parseExpression("-1n"))?.value).toBe(-1n);
		expect(getStaticValue(parseExpression("~1n"))?.value).toBe(-2n);
		expect(Object.is(getStaticValue(parseExpression("-0"))?.value, -0)).toBe(
			true,
		);
	});

	it("unwraps value-preserving expressions", () => {
		expect(getStaticValue(parseExpression("(1)"))?.value).toBe(1);
		expect(getStaticValue(parseExpression("1 as number"))?.value).toBe(1);
		expect(getStaticValue(parseExpression("1 satisfies number"))?.value).toBe(
			1,
		);
		expect(getStaticValue(parseExpression("'abc'!"))?.value).toBe("abc");
		expect(getStaticValue(parseExpression("<number>1"))?.value).toBe(1);
	});

	it("returns undefined for non-static expressions", () => {
		expect(getStaticValue(parseExpression("undefined"))).toBeUndefined();
		expect(getStaticValue(parseExpression("call()"))).toBeUndefined();
		expect(getStaticValue(parseExpression("member.value"))).toBeUndefined();
		expect(getStaticValue(parseExpression("`${value}`"))).toBeUndefined();
		expect(getStaticValue(parseExpression("+1n"))).toBeUndefined();
		expect(getStaticValue(parseExpression("-'1'"))).toBeUndefined();
		expect(getStaticValue(parseExpression("1 + 2"))).toBeUndefined();
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
