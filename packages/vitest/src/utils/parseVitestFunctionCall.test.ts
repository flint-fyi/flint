import ts, { SyntaxKind } from "typescript";
import { describe, expect, it } from "vitest";

import type { AST } from "@flint.fyi/typescript-language";

import { parseVitestFunctionCall } from "./parseVitestFunctionCall.ts";

const knownBlockNames = [
	"afterAll",
	"afterEach",
	"beforeAll",
	"beforeEach",
	"describe",
	"fit",
	"it",
	"test",
	"xdescribe",
	"xit",
	"xtest",
];

const unknownBlockNames = ["foo", "expect", "vi", "tests"];

describe(parseVitestFunctionCall, () => {
	it.each(knownBlockNames)("parses %s called as an identifier", (name) => {
		expect(
			parseVitestFunctionCall(parseCallExpression(`${name}(() => {})`)),
		).toMatchObject({
			name,
			segments: [],
		});
	});

	it.each(unknownBlockNames)(
		"returns undefined for unknown function %s",
		(name) => {
			expect(
				parseVitestFunctionCall(parseCallExpression(`${name}(() => {})`)),
			).toBeUndefined();
		},
	);

	it.each([
		{ segments: ["concurrent"], source: "test.concurrent(() => {})" },
		{ segments: ["fails"], source: "test.fails(() => {})" },
		{ segments: ["only"], source: "test.only(() => {})" },
		{ segments: ["runIf"], source: "test.runIf(true)" },
		{ segments: ["sequential"], source: "test.sequential(() => {})" },
		{ segments: ["skip"], source: "it.skip(() => {})" },
		{ segments: ["skipIf"], source: "it.skipIf(true)" },
		{ segments: ["todo"], source: "describe.todo(() => {})" },
		{ segments: ["skip", "only"], source: "test.skip.only(() => {})" },
	])("parses modifier chain $source", ({ segments, source }) => {
		expect(parseVitestFunctionCall(parseCallExpression(source))).toMatchObject({
			segments,
		});
	});

	it.each([
		"test.nonsense(() => {})",
		"test.each(() => {})",
		"test.skip.nonsense(() => {})",
		"test.extend({})",
	])("returns undefined for unknown modifier in %s", (source) => {
		expect(
			parseVitestFunctionCall(parseCallExpression(source)),
		).toBeUndefined();
	});

	it.each([
		{
			name: "test",
			segments: ["each"],
			source: "test.each([1])('%i', () => {})",
		},
		{
			name: "test",
			segments: ["skip", "each"],
			source: "test.skip.each([1])('%i', () => {})",
		},
		{
			name: "describe",
			segments: ["each"],
			source: "describe.each([1])('%i', () => {})",
		},
		{
			name: "test",
			segments: ["extend"],
			source: "test.extend({})('my test', () => {})",
		},
	])("parses call-returning callee $source", ({ name, segments, source }) => {
		expect(parseVitestFunctionCall(parseCallExpression(source))).toMatchObject({
			name,
			segments,
		});
	});

	it.each([
		{
			name: "test",
			segments: ["each"],
			source: "test.each`\na\n${1}\n`('%i', () => {})",
		},
		{
			name: "describe",
			segments: ["skip", "each"],
			source: "describe.skip.each`\na\n${1}\n`('%i', () => {})",
		},
	])("parses tagged template callee $source", ({ name, segments, source }) => {
		expect(parseVitestFunctionCall(parseCallExpression(source))).toMatchObject({
			name,
			segments,
		});
	});

	it.each([
		"nonsense.each([1])('%i', () => {})",
		"nonsense.each`\na\n${1}\n`('%i', () => {})",
		"test.nonsense.each([1])('%i', () => {})",
	])("returns undefined for call-returning callee %s", (source) => {
		expect(
			parseVitestFunctionCall(parseCallExpression(source)),
		).toBeUndefined();
	});

	it("accepts an unknown final segment on a call-returning callee", () => {
		expect(
			parseVitestFunctionCall(
				parseCallExpression("test.nonsense([1])('%i', () => {})"),
			),
		).toMatchObject({ name: "test", segments: ["nonsense"] });
	});

	it.each([
		"vitest.test(() => {})",
		"suite.it(() => {})",
		"test().it(() => {})",
	])("returns undefined when a known name is a property %s", (source) => {
		expect(
			parseVitestFunctionCall(parseCallExpression(source)),
		).toBeUndefined();
	});

	it.each([
		{ source: "test(() => {})", targetNode: "test" },
		{ source: "it.skip(() => {})", targetNode: "it.skip" },
		{ source: "test.skip.only(() => {})", targetNode: "test.skip.only" },
		{ source: "test.each([1])('%i', () => {})", targetNode: "test.each" },
	])(
		"reports $targetNode as the target node of $source",
		({ source, targetNode }) => {
			expect(
				parseVitestFunctionCall(
					parseCallExpression(source),
				)?.targetNode.getText(),
			).toBe(targetNode);
		},
	);
});

function parseCallExpression(source: string): AST.CallExpression {
	const sourceFile = ts.createSourceFile(
		"parseVitestFunctionCall.test.ts",
		`${source};`,
		ts.ScriptTarget.ESNext,
		true,
		ts.ScriptKind.TS,
	);
	const statement = sourceFile.statements[0];
	if (statement?.kind !== SyntaxKind.ExpressionStatement) {
		throw new Error(`Could not parse call expression: ${source}`);
	}

	const expression = (statement as ts.ExpressionStatement).expression;
	if (expression.kind !== SyntaxKind.CallExpression) {
		throw new Error(`Could not parse call expression: ${source}`);
	}

	return expression as AST.CallExpression;
}
