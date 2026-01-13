import rule from "./arrayTypes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		// Default style: "array" - reports Array<T> and ReadonlyArray<T>
		{
			code: `
const values: Array<string> = [];
`,
			snapshot: `
const values: Array<string> = [];
              ~~~~~~~~~~~~~
              Prefer \`T[]\` over \`Array<T>\`.
`,
		},
		{
			code: `
function process(items: Array<number>): void {}
`,
			snapshot: `
function process(items: Array<number>): void {}
                        ~~~~~~~~~~~~~
                        Prefer \`T[]\` over \`Array<T>\`.
`,
		},
		{
			code: `
type StringArray = Array<string>;
`,
			snapshot: `
type StringArray = Array<string>;
                   ~~~~~~~~~~~~~
                   Prefer \`T[]\` over \`Array<T>\`.
`,
		},
		{
			code: `
const values: ReadonlyArray<string> = [];
`,
			snapshot: `
const values: ReadonlyArray<string> = [];
              ~~~~~~~~~~~~~~~~~~~~~
              Prefer \`readonly T[]\` over \`ReadonlyArray<T>\`.
`,
		},
		{
			code: `
function process(items: ReadonlyArray<number>): void {}
`,
			snapshot: `
function process(items: ReadonlyArray<number>): void {}
                        ~~~~~~~~~~~~~~~~~~~~~
                        Prefer \`readonly T[]\` over \`ReadonlyArray<T>\`.
`,
		},
		// Style: "array" - explicit
		{
			code: `
const values: Array<string> = [];
`,
			options: { style: "array" },
			snapshot: `
const values: Array<string> = [];
              ~~~~~~~~~~~~~
              Prefer \`T[]\` over \`Array<T>\`.
`,
		},
		// Style: "generic" - reports T[] and readonly T[]
		{
			code: `
const values: string[] = [];
`,
			options: { style: "generic" },
			snapshot: `
const values: string[] = [];
              ~~~~~~~~
              Prefer \`Array<T>\` over \`T[]\`.
`,
		},
		{
			code: `
function process(items: number[]): void {}
`,
			options: { style: "generic" },
			snapshot: `
function process(items: number[]): void {}
                        ~~~~~~~~
                        Prefer \`Array<T>\` over \`T[]\`.
`,
		},
		{
			code: `
type StringArray = string[];
`,
			options: { style: "generic" },
			snapshot: `
type StringArray = string[];
                   ~~~~~~~~
                   Prefer \`Array<T>\` over \`T[]\`.
`,
		},
		{
			code: `
const values: readonly string[] = [];
`,
			options: { style: "generic" },
			snapshot: `
const values: readonly string[] = [];
              ~~~~~~~~~~~~~~~~~
              Prefer \`ReadonlyArray<T>\` over \`readonly T[]\`.
`,
		},
		{
			code: `
function process(items: readonly number[]): void {}
`,
			options: { style: "generic" },
			snapshot: `
function process(items: readonly number[]): void {}
                        ~~~~~~~~~~~~~~~~~
                        Prefer \`ReadonlyArray<T>\` over \`readonly T[]\`.
`,
		},
		// Style: "array-simple" - reports complex T[] and simple Array<T>
		{
			code: `
const values: Array<string> = [];
`,
			options: { style: "array-simple" },
			snapshot: `
const values: Array<string> = [];
              ~~~~~~~~~~~~~
              Prefer \`T[]\` over \`Array<T>\`.
`,
		},
		{
			code: `
const values: ReadonlyArray<number> = [];
`,
			options: { style: "array-simple" },
			snapshot: `
const values: ReadonlyArray<number> = [];
              ~~~~~~~~~~~~~~~~~~~~~
              Prefer \`readonly T[]\` over \`ReadonlyArray<T>\`.
`,
		},
		{
			code: `
type Mixed = (string | number)[];
`,
			options: { style: "array-simple" },
			snapshot: `
type Mixed = (string | number)[];
             ~~~~~~~~~~~~~~~~~~~
             Prefer \`Array<T>\` over \`T[]\`.
`,
		},
		{
			code: `
type Intersection = (Foo & Bar)[];
`,
			options: { style: "array-simple" },
			snapshot: `
type Intersection = (Foo & Bar)[];
                    ~~~~~~~~~~~~~
                    Prefer \`Array<T>\` over \`T[]\`.
`,
		},
		{
			code: `
type Func = (() => void)[];
`,
			options: { style: "array-simple" },
			snapshot: `
type Func = (() => void)[];
            ~~~~~~~~~~~~~~
            Prefer \`Array<T>\` over \`T[]\`.
`,
		},
		{
			code: `
type ReadonlyMixed = readonly (string | number)[];
`,
			options: { style: "array-simple" },
			snapshot: `
type ReadonlyMixed = readonly (string | number)[];
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Prefer \`ReadonlyArray<T>\` over \`readonly T[]\`.
`,
		},
		{
			code: `
type Obj = { a: string }[];
`,
			options: { style: "array-simple" },
			snapshot: `
type Obj = { a: string }[];
           ~~~~~~~~~~~~~~~
           Prefer \`Array<T>\` over \`T[]\`.
`,
		},
	],
	valid: [
		// Default style: "array"
		`const values: string[] = [];`,
		`function process(items: number[]): void {}`,
		`type StringArray = string[];`,
		`const values: readonly string[] = [];`,
		`function process(items: readonly number[]): void {}`,
		`const map: Map<string, number> = new Map();`,
		`const set: Set<string> = new Set();`,
		`const nested: string[][] = [];`,
		`const mixed: (string | number)[] = [];`,
		`
type Array<T> = { other: T };
const values: Array<string> = [];
export {};
`,
		`
type ReadonlyArray<T> = { other: T };
const values: ReadonlyArray<string> = [];
export {};
`,
		// Style: "generic"
		{
			code: `const values: Array<string> = [];`,
			options: { style: "generic" },
		},
		{
			code: `const values: ReadonlyArray<string> = [];`,
			options: { style: "generic" },
		},
		{
			code: `const values: Array<string | number> = [];`,
			options: { style: "generic" },
		},
		// Style: "array-simple"
		{
			code: `const values: string[] = [];`,
			options: { style: "array-simple" },
		},
		{
			code: `const values: readonly string[] = [];`,
			options: { style: "array-simple" },
		},
		{
			code: `const values: Array<string | number> = [];`,
			options: { style: "array-simple" },
		},
		{
			code: `const values: ReadonlyArray<Foo & Bar> = [];`,
			options: { style: "array-simple" },
		},
		{
			code: `type Nested = string[][] = [];`,
			options: { style: "array-simple" },
		},
		{
			code: `type TypeRef = MyType[];`,
			options: { style: "array-simple" },
		},
	],
});
