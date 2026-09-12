import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryTypeAnnotations.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let amount: number = 1;
var label: string = "item";
let enabled: boolean = true;
let total: bigint = 1n;
let template: string = \`text\`;
let positive: number = +1;
let negative: number = -1;
let negativeLarge: bigint = -1n;
let negated: boolean = !0;
`,
			output: `
let amount = 1;
var label = "item";
let enabled = true;
let total = 1n;
let template = \`text\`;
let positive = +1;
let negative = -1;
let negativeLarge = -1n;
let negated = !0;
`,
			snapshot: `
let amount: number = 1;
            ~~~~~~
            This type annotation does not change TypeScript's inferred type.
var label: string = "item";
           ~~~~~~
           This type annotation does not change TypeScript's inferred type.
let enabled: boolean = true;
             ~~~~~~~
             This type annotation does not change TypeScript's inferred type.
let total: bigint = 1n;
           ~~~~~~
           This type annotation does not change TypeScript's inferred type.
let template: string = \`text\`;
              ~~~~~~
              This type annotation does not change TypeScript's inferred type.
let positive: number = +1;
              ~~~~~~
              This type annotation does not change TypeScript's inferred type.
let negative: number = -1;
              ~~~~~~
              This type annotation does not change TypeScript's inferred type.
let negativeLarge: bigint = -1n;
                   ~~~~~~
                   This type annotation does not change TypeScript's inferred type.
let negated: boolean = !0;
             ~~~~~~~
             This type annotation does not change TypeScript's inferred type.
`,
		},
		{
			code: `
const count: 1 = 1;
const status: "ready" = "ready";
`,
			output: `
const count = 1;
const status = "ready";
`,
			snapshot: `
const count: 1 = 1;
             ~
             This type annotation does not change TypeScript's inferred type.
const status: "ready" = "ready";
              ~~~~~~~
              This type annotation does not change TypeScript's inferred type.
`,
		},
		{
			code: `
class State {
    readonly exact: 1 = 1;
    field: string = "value";
    #privateValue: number = 1;
    static total: number = 1;
    accessor active: boolean = true;
    "label": string = "value";
    0: number = 1;
    constructor(public count: number = 1, readonly enabled: boolean = true) {}
}
function run(value: number = 1) {}
`,
			output: `
class State {
    readonly exact = 1;
    field = "value";
    #privateValue = 1;
    static total = 1;
    accessor active = true;
    "label" = "value";
    0 = 1;
    constructor(public count = 1, readonly enabled = true) {}
}
function run(value = 1) {}
`,
			snapshot: `
class State {
    readonly exact: 1 = 1;
                    ~
                    This type annotation does not change TypeScript's inferred type.
    field: string = "value";
           ~~~~~~
           This type annotation does not change TypeScript's inferred type.
    #privateValue: number = 1;
                   ~~~~~~
                   This type annotation does not change TypeScript's inferred type.
    static total: number = 1;
                  ~~~~~~
                  This type annotation does not change TypeScript's inferred type.
    accessor active: boolean = true;
                     ~~~~~~~
                     This type annotation does not change TypeScript's inferred type.
    "label": string = "value";
             ~~~~~~
             This type annotation does not change TypeScript's inferred type.
    0: number = 1;
       ~~~~~~
       This type annotation does not change TypeScript's inferred type.
    constructor(public count: number = 1, readonly enabled: boolean = true) {}
                              ~~~~~~
                              This type annotation does not change TypeScript's inferred type.
                                                            ~~~~~~~
                                                            This type annotation does not change TypeScript's inferred type.
}
function run(value: number = 1) {}
                    ~~~~~~
                    This type annotation does not change TypeScript's inferred type.
`,
		},
		{
			code: `
const numeric: number = Number("1");
const text: string = String(1);
const large: bigint = BigInt(1);
const notANumber: number = NaN;
const infinity: number = Infinity;
const missing: undefined = undefined;
const voided: undefined = void 0;
const pattern: RegExp = /value/;
const constructed: RegExp = new RegExp("value");
function check(Number: () => boolean) {
    const shadowed: boolean = Number();
}
`,
			output: `
const numeric = Number("1");
const text = String(1);
const large = BigInt(1);
const notANumber = NaN;
const infinity = Infinity;
const missing = undefined;
const voided = void 0;
const pattern = /value/;
const constructed = new RegExp("value");
function check(Number: () => boolean) {
    const shadowed = Number();
}
`,
			snapshot: `
const numeric: number = Number("1");
               ~~~~~~
               This type annotation does not change TypeScript's inferred type.
const text: string = String(1);
            ~~~~~~
            This type annotation does not change TypeScript's inferred type.
const large: bigint = BigInt(1);
             ~~~~~~
             This type annotation does not change TypeScript's inferred type.
const notANumber: number = NaN;
                  ~~~~~~
                  This type annotation does not change TypeScript's inferred type.
const infinity: number = Infinity;
                ~~~~~~
                This type annotation does not change TypeScript's inferred type.
const missing: undefined = undefined;
               ~~~~~~~~~
               This type annotation does not change TypeScript's inferred type.
const voided: undefined = void 0;
              ~~~~~~~~~
              This type annotation does not change TypeScript's inferred type.
const pattern: RegExp = /value/;
               ~~~~~~
               This type annotation does not change TypeScript's inferred type.
const constructed: RegExp = new RegExp("value");
                   ~~~~~~
                   This type annotation does not change TypeScript's inferred type.
function check(Number: () => boolean) {
    const shadowed: boolean = Number();
                    ~~~~~~~
                    This type annotation does not change TypeScript's inferred type.
}
`,
		},
		{
			code: `
declare const numeric: number;
declare const values: number[];
declare const maybeNumeric: number | undefined;
declare const promise: Promise<number>;
const identifier: number = numeric;
let sum: number = numeric + 1;
let template: string = \`value: \${numeric}\`;
let kind: string = typeof numeric;
let incremented: number = numeric++;
let asserted: 1 = 1 as const;
let angleAsserted: 1 = <1>1;
let checked: number = 1 satisfies number;
const nonNull: number = maybeNumeric!;
async function load() {
    const awaited: number = await promise;
}
class Self {
    value: number = 1;
}
function fixed(): number { return 1; }
function overloaded(value: string): number;
function overloaded(value: number): string;
function overloaded(value: string | number): string | number { return value; }
const fixedResult: number = fixed();
const overloadedResult: number = overloaded("value");
const date: Date = new Date();
`,
			output: `
declare const numeric: number;
declare const values: number[];
declare const maybeNumeric: number | undefined;
declare const promise: Promise<number>;
const identifier = numeric;
let sum = numeric + 1;
let template = \`value: \${numeric}\`;
let kind = typeof numeric;
let incremented = numeric++;
let asserted = 1 as const;
let angleAsserted = <1>1;
let checked = 1 satisfies number;
const nonNull = maybeNumeric!;
async function load() {
    const awaited = await promise;
}
class Self {
    value = 1;
}
function fixed(): number { return 1; }
function overloaded(value: string): number;
function overloaded(value: number): string;
function overloaded(value: string | number): string | number { return value; }
const fixedResult = fixed();
const overloadedResult = overloaded("value");
const date = new Date();
`,
			snapshot: `
declare const numeric: number;
declare const values: number[];
declare const maybeNumeric: number | undefined;
declare const promise: Promise<number>;
const identifier: number = numeric;
                  ~~~~~~
                  This type annotation does not change TypeScript's inferred type.
let sum: number = numeric + 1;
         ~~~~~~
         This type annotation does not change TypeScript's inferred type.
let template: string = \`value: \${numeric}\`;
              ~~~~~~
              This type annotation does not change TypeScript's inferred type.
let kind: string = typeof numeric;
          ~~~~~~
          This type annotation does not change TypeScript's inferred type.
let incremented: number = numeric++;
                 ~~~~~~
                 This type annotation does not change TypeScript's inferred type.
let asserted: 1 = 1 as const;
              ~
              This type annotation does not change TypeScript's inferred type.
let angleAsserted: 1 = <1>1;
                   ~
                   This type annotation does not change TypeScript's inferred type.
let checked: number = 1 satisfies number;
             ~~~~~~
             This type annotation does not change TypeScript's inferred type.
const nonNull: number = maybeNumeric!;
               ~~~~~~
               This type annotation does not change TypeScript's inferred type.
async function load() {
    const awaited: number = await promise;
                   ~~~~~~
                   This type annotation does not change TypeScript's inferred type.
}
class Self {
    value: number = 1;
           ~~~~~~
           This type annotation does not change TypeScript's inferred type.
}
function fixed(): number { return 1; }
function overloaded(value: string): number;
function overloaded(value: number): string;
function overloaded(value: string | number): string | number { return value; }
const fixedResult: number = fixed();
                   ~~~~~~
                   This type annotation does not change TypeScript's inferred type.
const overloadedResult: number = overloaded("value");
                        ~~~~~~
                        This type annotation does not change TypeScript's inferred type.
const date: Date = new Date();
            ~~~~
            This type annotation does not change TypeScript's inferred type.
`,
		},
		{
			code: `
type Result = { ok: boolean };
declare function createResult(): Result;
declare const unknownValue: unknown;
declare function fail(): never;
const result: Result = createResult();
const unknownResult: unknown = unknownValue;
const neverResult: never = fail();
`,
			output: `
type Result = { ok: boolean };
declare function createResult(): Result;
declare const unknownValue: unknown;
declare function fail(): never;
const result = createResult();
const unknownResult = unknownValue;
const neverResult = fail();
`,
			snapshot: `
type Result = { ok: boolean };
declare function createResult(): Result;
declare const unknownValue: unknown;
declare function fail(): never;
const result: Result = createResult();
              ~~~~~~
              This type annotation does not change TypeScript's inferred type.
const unknownResult: unknown = unknownValue;
                     ~~~~~~~
                     This type annotation does not change TypeScript's inferred type.
const neverResult: never = fail();
                   ~~~~~
                   This type annotation does not change TypeScript's inferred type.
`,
		},
		{
			code: `
const nothing: null = null;
function run(nothing: null = null, missing: undefined = undefined) {}
class Empty {
    nothing: null = null;
    missing: undefined = undefined;
}
`,
			output: `
const nothing = null;
function run(nothing = null, missing = undefined) {}
class Empty {
    nothing = null;
    missing = undefined;
}
`,
			snapshot: `
const nothing: null = null;
               ~~~~
               This type annotation does not change TypeScript's inferred type.
function run(nothing: null = null, missing: undefined = undefined) {}
                      ~~~~
                      This type annotation does not change TypeScript's inferred type.
                                            ~~~~~~~~~
                                            This type annotation does not change TypeScript's inferred type.
class Empty {
    nothing: null = null;
             ~~~~
             This type annotation does not change TypeScript's inferred type.
    missing: undefined = undefined;
             ~~~~~~~~~
             This type annotation does not change TypeScript's inferred type.
}
`,
		},
		{
			code: `
export const count: 1 = 1;
`,
			files: createRuleTesterTSConfig({
				declaration: true,
				isolatedDeclarations: true,
			}),
			output: `
export const count = 1;
`,
			snapshot: `
export const count: 1 = 1;
                    ~
                    This type annotation does not change TypeScript's inferred type.
`,
		},
		{
			code: `
export const count: 1 = (1);
export let positive: number = +1;
export let negative: number = -1;
export let large: bigint = -1n;
`,
			files: createRuleTesterTSConfig({
				declaration: true,
				isolatedDeclarations: true,
			}),
			output: `
export const count = (1);
export let positive = +1;
export let negative = -1;
export let large = -1n;
`,
			snapshot: `
export const count: 1 = (1);
                    ~
                    This type annotation does not change TypeScript's inferred type.
export let positive: number = +1;
                     ~~~~~~
                     This type annotation does not change TypeScript's inferred type.
export let negative: number = -1;
                     ~~~~~~
                     This type annotation does not change TypeScript's inferred type.
export let large: bigint = -1n;
                  ~~~~~~
                  This type annotation does not change TypeScript's inferred type.
`,
		},
		{
			code: `
let count: /* measurement */ number = 1;
`,
			snapshot: `
let count: /* measurement */ number = 1;
                             ~~~~~~
                             This type annotation does not change TypeScript's inferred type.
`,
		},
	],
	valid: [
		`const count = 1;`,
		`let count: number;`,
		`const count: number = 1;`,
		`let count: 1 = 1;`,
		`let count: 1 = (1);`,
		`let count: 1 = 1!;`,
		`class Counter { readonly count: number = 1; }`,
		`class Counter { count: 1 = 1; }`,
		`class Counter { accessor count: 1 = 1; }`,
		`class Counter { constructor(readonly count: 1 = 1) {} }`,
		`function run(count: 1 = 1) {}`,
		`const values: number[] = [];`,
		`const value: { count: number } = { count: 1 };`,
		`const callback: () => number = () => 1;`,
		`const callback: () => number = function () { return 1; };`,
		`const Type = class {}; const value: typeof Type = class {};`,
		`const element: JSX.Element = <div />;`,
		`declare const values: number[]; const value: number = values.length;`,
		`declare const values: number[]; const value: number = values[0]!;`,
		`const value: number = true ? 1 : 2;`,
		`const value: number = 1 || 2;`,
		`const value: number = 1 && 2;`,
		`const value: number = undefined ?? 1;`,
		`let target = 0; const value: number = (target = 1);`,
		`const value: number = (0, 1);`,
		`function generic<T>(): T { throw new Error(); } const value: number = generic<number>();`,
		`class Generic<T> {} const value: Generic<number> = new Generic<number>();`,
		`const value: any = missing;`,
		`function run(value?: number) {} run();`,
		`function run(...values: number[]) {} run();`,
		`function run({ value }: { value: number } = { value: 1 }) {}`,
		`class Counter { count?: number = 1; definite!: number; ["count"]: number = 1; }`,
		`class Counter { get count(): number { return 1; } set count(value: number) {} }`,
		`const { count }: { count: number } = { count: 1 };`,
		`const [count]: [number] = [1];`,
		`using resource: Disposable = getResource();`,
		`await using resource: AsyncDisposable = getResource();`,
		`let value: null = null;`,
		`let value: undefined = undefined;`,
		`var value: null = null;`,
		`const value: void = undefined;`,
		`const symbol: symbol = Symbol();`,
		`const symbol: unique symbol = Symbol();`,
		`declare function createSymbol(): symbol; const symbol: symbol = createSymbol();`,
		`const enabled: boolean = Boolean(1);`,
		`class Self { self: Self = this; }`,
		`const value: number = optional?.();`,
		`const Number = () => "value"; const value: number = Number();`,
		`const undefined = "value"; const value: undefined = undefined;`,
		`interface Shape { value: number } class Box { value = 1; } const value: Shape = new Box();`,
		`type Left = { value: number }; type Right = { value: number }; declare function create(): Right; const value: Left = create();`,
		{
			code: `const value: null = null; function run(value: null = null) {} class Box { value: null = null; }`,
			files: createRuleTesterTSConfig({ strictNullChecks: false }),
		},
		{
			code: `const value: null = null;`,
			files: createRuleTesterTSConfig({ strict: false }),
		},
		{
			code: `const nothing: null = null;`,
			files: createRuleTesterTSConfig({ strict: undefined }),
		},
		{
			code: `export const value: number = fixed();`,
			files: createRuleTesterTSConfig({
				declaration: true,
				isolatedDeclarations: true,
			}),
		},
		{
			code: `export const value: number = +"1"; export const enabled: boolean = !0;`,
			files: createRuleTesterTSConfig({
				declaration: true,
				isolatedDeclarations: true,
			}),
		},
	],
});
