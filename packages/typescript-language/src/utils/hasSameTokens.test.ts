import { expect, it } from "vitest";

import { nullThrows } from "@flint.fyi/utils";

import { createNativeSourceFile } from "../test/createNativeSourceFile.testUtils.ts";
import type * as AST from "../types/ast.ts";
import { hasSameTokens } from "./hasSameTokens.ts";

it.each([
	["regular expressions", "const a = /[/]/g; const b = /[/]/g;"],
	["quote-equivalent strings", `const a = "value"; const b = 'value';`],
	["escape-equivalent strings", `const a = "value"; const b = '\\x76alue';`],
	["template expressions", "const a = `x${value}y`; const b = `x${value}y`;"],
	[
		"JSX",
		'const a = <div title="x">text</div>; const b = <div title="x">text</div>;',
	],
])("compares parsed %s tokens", (_name, code) => {
	const sourceFile = createNativeSourceFile(
		code,
		code.includes("<div") ? ".tsx" : ".ts",
	);
	const first = nullThrows(
		sourceFile.statements[0],
		"Expected the first variable statement.",
	) as AST.AnyNode;
	const second = nullThrows(
		sourceFile.statements[1],
		"Expected the second variable statement.",
	) as AST.AnyNode;

	expect(
		hasSameTokens(getInitializer(first), getInitializer(second), sourceFile),
	).toBe(true);
});

it.each([
	["identifiers", "first", "second"],
	["numeric literals", "1", "2"],
	["bigint literals", "1n", "2n"],
	["string literals", '"first"', '"second"'],
	["no-substitution templates", "`first`", "`second`"],
	["prefix unary operators", "+value", "-value"],
	["prefix update operators", "++value", "--value"],
	["postfix unary operators", "value++", "value--"],
	["regular expression literals", "/first/", "/second/"],
])("distinguishes differing %s", (_name, firstCode, secondCode) => {
	const sourceFile = createNativeSourceFile(
		`const a = ${firstCode}; const b = ${secondCode};`,
	);
	const first = nullThrows(
		sourceFile.statements[0],
		"Expected the first variable statement.",
	) as AST.AnyNode;
	const second = nullThrows(
		sourceFile.statements[1],
		"Expected the second variable statement.",
	) as AST.AnyNode;

	expect(
		hasSameTokens(getInitializer(first), getInitializer(second), sourceFile),
	).toBe(false);
});

it.each([
	["array and object literals", "[value]", "{ value }"],
	["call and new expressions", "value()", "new value()"],
	["sibling and nested calls", "f(g(), h())", "f(g(h()))"],
])(
	"distinguishes structurally different %s",
	(_name, firstCode, secondCode) => {
		const sourceFile = createNativeSourceFile(
			`const a = ${firstCode}; const b = ${secondCode};`,
		);
		const first = nullThrows(
			sourceFile.statements[0],
			"Expected the first variable statement.",
		) as AST.AnyNode;
		const second = nullThrows(
			sourceFile.statements[1],
			"Expected the second variable statement.",
		) as AST.AnyNode;

		expect(
			hasSameTokens(getInitializer(first), getInitializer(second), sourceFile),
		).toBe(false);
	},
);

it("distinguishes let and const declarations", () => {
	const sourceFile = createNativeSourceFile("let a = 1; const a = 1;");
	const first = nullThrows(
		sourceFile.statements[0],
		"Expected the first variable statement.",
	) as AST.AnyNode;
	const second = nullThrows(
		sourceFile.statements[1],
		"Expected the second variable statement.",
	) as AST.AnyNode;

	expect(hasSameTokens(first, second, sourceFile)).toBe(false);
});

it.each([
	["interpolated template text", "`first${value}`", "`second${value}`", ".ts"],
	["JSX text", "<div>first</div>", "<div>second</div>", ".tsx"],
])("ignores differing %s", (_name, firstCode, secondCode, extension) => {
	const sourceFile = createNativeSourceFile(
		`const a = ${firstCode}; const b = ${secondCode};`,
		extension,
	);
	const first = nullThrows(
		sourceFile.statements[0],
		"Expected the first variable statement.",
	) as AST.AnyNode;
	const second = nullThrows(
		sourceFile.statements[1],
		"Expected the second variable statement.",
	) as AST.AnyNode;

	expect(
		hasSameTokens(getInitializer(first), getInitializer(second), sourceFile),
	).toBe(true);
});

function getInitializer(statement: AST.AnyNode): AST.AnyNode {
	const declaration = nullThrows(
		(statement as AST.VariableStatement).declarationList.declarations[0],
		"Expected a variable declaration.",
	);
	return nullThrows(
		declaration.initializer,
		"Expected a variable initializer.",
	);
}
