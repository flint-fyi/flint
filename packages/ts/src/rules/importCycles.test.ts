import ts from "typescript";
import { describe, expect, it } from "vitest";

import rule, { resolveModuleSourceFiles } from "./importCycles.ts";
import { ruleTester } from "./ruleTester.ts";

describe(resolveModuleSourceFiles, () => {
	it("follows aliased module symbols and filters their declarations", () => {
		const sourceFile = ts.createSourceFile(
			"source.ts",
			"export const value = true;",
			ts.ScriptTarget.Latest,
		);
		const targetSymbol = {
			declarations: [sourceFile, ts.factory.createIdentifier("other")],
			flags: ts.SymbolFlags.ValueModule,
		} as unknown as ts.Symbol;
		const aliasSymbol = {
			flags: ts.SymbolFlags.Alias,
		} as unknown as ts.Symbol;
		const typeChecker = {
			getAliasedSymbol: () => targetSymbol,
			getSymbolAtLocation: () => aliasSymbol,
		};

		expect(
			resolveModuleSourceFiles(
				typeChecker,
				ts.factory.createStringLiteral("./source"),
				new Set([sourceFile]),
			),
		).toEqual([sourceFile]);
		expect(
			resolveModuleSourceFiles(
				{
					...typeChecker,
					getSymbolAtLocation: () => undefined,
				},
				ts.factory.createStringLiteral("./missing"),
				new Set([sourceFile]),
			),
		).toBeUndefined();
	});
});

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import "./file";
`,
			snapshot: `
import "./file";
       ~~~~~~~~
       Circular module dependency: file.ts → file.ts.
`,
		},
		{
			code: `
import { value } from "./second";
export { value };
`,
			files: {
				"second.ts": `export { value } from "./file";`,
			},
			snapshot: `
import { value } from "./second";
                      ~~~~~~~~~~
                      Circular module dependency: file.ts → second.ts → file.ts.
export { value };
`,
		},
		{
			code: `
import "./second";
`,
			files: {
				"second.ts": `export const second = true; void import(\`./third\`);`,
				"third.ts": `export const third = true; import "./file";`,
			},
			snapshot: `
import "./second";
       ~~~~~~~~~~
       Circular module dependency: file.ts → second.ts → third.ts → file.ts.
`,
		},
		{
			code: `
import { type Model } from "./second";
export { type Model };
`,
			files: {
				"second.ts": `export { type Model } from "./file";`,
			},
			snapshot: `
import { type Model } from "./second";
                           ~~~~~~~~~~
                           Circular module dependency: file.ts → second.ts → file.ts.
export { type Model };
`,
		},
		{
			code: `
import "./second";
export * from "./second";
`,
			files: {
				"second.ts": `import "./file";`,
			},
			snapshot: `
import "./second";
       ~~~~~~~~~~
       Circular module dependency: file.ts → second.ts → file.ts.
export * from "./second";
`,
		},
		{
			code: `
import "./second";
import "./third";
`,
			files: {
				"second.ts": `import "./file"; import "./third";`,
				"third.ts": `import "./file"; import "./second";`,
			},
			snapshot: `
import "./second";
       ~~~~~~~~~~
       Circular module dependency: file.ts → second.ts → file.ts.
import "./third";
       ~~~~~~~~~
       Circular module dependency: file.ts → third.ts → file.ts.
`,
		},
	],
	valid: [
		`import "./missing";`,
		{
			code: `import type { Model } from "./second";`,
			files: { "second.ts": `import "./file"; export interface Model {}` },
		},
		{
			code: `export type { Model } from "./second";`,
			files: { "second.ts": `import "./file"; export interface Model {}` },
		},
		{
			code: `type Model = import("./second").Model;`,
			files: { "second.ts": `import "./file"; export interface Model {}` },
		},
		{
			code: `const name = "second"; void import(\`./\${name}\`);`,
			files: { "second.ts": `import "./file";` },
		},
		{
			code: `const value = require("./second"); void value;`,
			files: { "second.ts": `import "./file";` },
		},
		{
			code: `import second = require("./second"); void second;`,
			files: { "second.ts": `import "./file";` },
		},
		{
			code: `import "./second";`,
			files: { "second.ts": `export const value = 1;` },
		},
		{
			code: `export const selected = true;`,
			files: {
				"second.ts": `import "./third";`,
				"third.ts": `import "./second";`,
			},
		},
	],
});
