import ts, { SyntaxKind } from "typescript";
import { describe, expect, it } from "vitest";

import type { AST } from "@flint.fyi/typescript-language";

import { parseVitestFunctionCall } from "./parseVitestFunctionCall.ts";

const knownVitestFunctions = [
	{ kind: "hook", name: "afterAll" },
	{ kind: "hook", name: "afterEach" },
	{ kind: "hook", name: "aroundAll" },
	{ kind: "hook", name: "aroundEach" },
	{ kind: "hook", name: "beforeAll" },
	{ kind: "hook", name: "beforeEach" },
	{ kind: "describe", name: "describe" },
	{ kind: "test", name: "it" },
	{ kind: "describe", name: "suite" },
	{ kind: "test", name: "test" },
];

const unknownVitestFunctionNames = ["foo", "expect", "vi", "tests"];

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

describe(parseVitestFunctionCall, () => {
	it.each(knownVitestFunctions)(
		"parses $name called as an identifier",
		({ kind, name }) => {
			expect(
				parseVitestFunctionCall(parseCallExpression(`${name}(() => {})`)),
			).toMatchObject({
				kind,
				members: [],
				name,
			});
		},
	);

	it.each(unknownVitestFunctionNames)(
		"returns undefined for unknown function %s",
		(name) => {
			expect(
				parseVitestFunctionCall(parseCallExpression(`${name}(() => {})`)),
			).toBeUndefined();
		},
	);

	it.each([
		{ members: ["concurrent"], source: "test.concurrent(() => {})" },
		{ members: ["fails"], source: "test.fails(() => {})" },
		{ members: ["only"], source: "test.only(() => {})" },
		{ members: ["sequential"], source: "test.sequential(() => {})" },
		{ members: ["shuffle"], source: "describe.shuffle(() => {})" },
		{ members: ["skip"], source: "it.skip(() => {})" },
		{ members: ["todo"], source: "describe.todo(() => {})" },
		{ members: ["skip", "only"], source: "test.skip.only(() => {})" },
		{ members: ["skip"], source: 'test["skip"](() => {})' },
		{ members: ["skip"], source: "test[`skip`](() => {})" },
		{ members: ["skip", "only"], source: 'test.skip["only"](() => {})' },
		{ members: ["skip", "only"], source: 'test["skip"].only(() => {})' },
	])("parses modifier chain $source", ({ members, source }) => {
		expect(parseVitestFunctionCall(parseCallExpression(source))).toMatchObject({
			members,
		});
	});

	it.each([
		"test.nonsense(() => {})",
		"test.each(() => {})",
		"test.skip.nonsense(() => {})",
		"test.extend({})",
		"test.runIf(true)",
		"it.skipIf(true)",
		'test["nonsense"](() => {})',
	])("returns undefined for unknown modifier in %s", (source) => {
		expect(
			parseVitestFunctionCall(parseCallExpression(source)),
		).toBeUndefined();
	});

	it.each([
		{
			members: ["each"],
			name: "test",
			source: "test.each([1])('%i', () => {})",
		},
		{
			members: ["skip", "each"],
			name: "test",
			source: "test.skip.each([1])('%i', () => {})",
		},
		{
			members: ["each"],
			name: "describe",
			source: "describe.each([1])('%i', () => {})",
		},
		{
			members: ["each"],
			name: "test",
			source: "test[\"each\"]([1])('%i', () => {})",
		},
		{
			members: ["extend"],
			name: "test",
			source: "test.extend({})('my test', () => {})",
		},
		{
			members: ["runIf"],
			name: "test",
			source: "test.runIf(true)('my test', () => {})",
		},
		{
			members: ["skipIf"],
			name: "it",
			source: "it.skipIf(true)('my test', () => {})",
		},
	])("parses call-returning callee $source", ({ members, name, source }) => {
		expect(parseVitestFunctionCall(parseCallExpression(source))).toMatchObject({
			members,
			name,
		});
	});

	it.each([
		{
			members: ["each"],
			name: "test",
			source: "test.each`\na\n${1}\n`('%i', () => {})",
		},
		{
			members: ["skip", "each"],
			name: "describe",
			source: "describe.skip.each`\na\n${1}\n`('%i', () => {})",
		},
	])("parses tagged template callee $source", ({ members, name, source }) => {
		expect(parseVitestFunctionCall(parseCallExpression(source))).toMatchObject({
			members,
			name,
		});
	});

	it.each([
		{ members: [], name: "test", source: "test!()" },
		{ members: ["only"], name: "test", source: "test.only!()" },
		{ members: ["only"], name: "test", source: "test!.only()" },
		{
			members: ["each"],
			name: "test",
			source: "test.each([1])!('%i', () => {})",
		},
		{
			members: ["each"],
			name: "test",
			source: "test.each`\na\n${1}\n`!('%i', () => {})",
		},
		{
			members: ["extend"],
			name: "test",
			source: "test.extend({})!('my test', () => {})",
		},
	])("parses non-null asserted callee $source", ({ members, name, source }) => {
		expect(parseVitestFunctionCall(parseCallExpression(source))).toMatchObject({
			members,
			name,
		});
	});

	it.each([
		"nonsense.each([1])('%i', () => {})",
		"nonsense.each`\na\n${1}\n`('%i', () => {})",
		"test.nonsense.each([1])('%i', () => {})",
		"test.nonsense.each([1])!('%i', () => {})",
		"test.nonsense([1])('%i', () => {})",
	])("returns undefined for call-returning callee %s", (source) => {
		expect(
			parseVitestFunctionCall(parseCallExpression(source)),
		).toBeUndefined();
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
		"test[modifier](() => {})",
		"test[`${modifier}`](() => {})",
		"this.test(() => {})",
		"(0, test)(() => {})",
	])("returns undefined for unsupported callee syntax %s", (source) => {
		expect(
			parseVitestFunctionCall(parseCallExpression(source)),
		).toBeUndefined();
	});

	it.each([
		{ source: "test(() => {})", targetNode: "test" },
		{ source: "it.skip(() => {})", targetNode: "it.skip" },
		{ source: "test.skip.only(() => {})", targetNode: "test.skip.only" },
		{ source: 'test["skip"](() => {})', targetNode: 'test["skip"]' },
		{ source: "test.each([1])('%i', () => {})", targetNode: "test.each" },
		{ source: "test!(() => {})", targetNode: "test" },
		{ source: "test.skip!(() => {})", targetNode: "test.skip" },
		{ source: "test.each([1])!('%i', () => {})", targetNode: "test.each" },
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
