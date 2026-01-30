import rule from "./nullishCoalescingOperators.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let value: string | null = null;
const result = value || "default";
`,
			output: `
let value: string | null = null;
const result = value ?? "default";
`,
			snapshot: `
let value: string | null = null;
const result = value || "default";
               ~~~~~~~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: number | undefined = undefined;
const result = value || 0;
`,
			output: `
let value: number | undefined = undefined;
const result = value ?? 0;
`,
			snapshot: `
let value: number | undefined = undefined;
const result = value || 0;
               ~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: boolean | null = null;
const result = value || false;
`,
			output: `
let value: boolean | null = null;
const result = value ?? false;
`,
			snapshot: `
let value: boolean | null = null;
const result = value || false;
               ~~~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: null = null;
const result = value || "default";
`,
			output: `
let value: null = null;
const result = value ?? "default";
`,
			snapshot: `
let value: null = null;
const result = value || "default";
               ~~~~~~~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: undefined = undefined;
const result = value || "default";
`,
			output: `
let value: undefined = undefined;
const result = value ?? "default";
`,
			snapshot: `
let value: undefined = undefined;
const result = value || "default";
               ~~~~~~~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: null | undefined = null;
const result = value || "default";
`,
			output: `
let value: null | undefined = null;
const result = value ?? "default";
`,
			snapshot: `
let value: null | undefined = null;
const result = value || "default";
               ~~~~~~~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: object | null = null;
const result = value || {};
`,
			output: `
let value: object | null = null;
const result = value ?? {};
`,
			snapshot: `
let value: object | null = null;
const result = value || {};
               ~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: (() => void) | undefined = undefined;
const result = value || (() => {});
`,
			output: `
let value: (() => void) | undefined = undefined;
const result = value ?? (() => {});
`,
			snapshot: `
let value: (() => void) | undefined = undefined;
const result = value || (() => {});
               ~~~~~~~~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: symbol | null = null;
const result = value || Symbol("default");
`,
			output: `
let value: symbol | null = null;
const result = value ?? Symbol("default");
`,
			snapshot: `
let value: symbol | null = null;
const result = value || Symbol("default");
               ~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: bigint | undefined = undefined;
const result = value || 0n;
`,
			output: `
let value: bigint | undefined = undefined;
const result = value ?? 0n;
`,
			snapshot: `
let value: bigint | undefined = undefined;
const result = value || 0n;
               ~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: true | null = null;
const result = value || true;
`,
			output: `
let value: true | null = null;
const result = value ?? true;
`,
			snapshot: `
let value: true | null = null;
const result = value || true;
               ~~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: 1 | undefined = undefined;
const result = value || 1;
`,
			output: `
let value: 1 | undefined = undefined;
const result = value ?? 1;
`,
			snapshot: `
let value: 1 | undefined = undefined;
const result = value || 1;
               ~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: "a" | null = null;
const result = value || "b";
`,
			output: `
let value: "a" | null = null;
const result = value ?? "b";
`,
			snapshot: `
let value: "a" | null = null;
const result = value || "b";
               ~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: 1n | undefined = undefined;
const result = value || 1n;
`,
			output: `
let value: 1n | undefined = undefined;
const result = value ?? 1n;
`,
			snapshot: `
let value: 1n | undefined = undefined;
const result = value || 1n;
               ~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over logical OR (\`||\`) for nullish checks.
`,
		},
		{
			code: `
let value: string | null = null;
const result = value ? value : "default";
`,
			output: `
let value: string | null = null;
const result = value ?? "default";
`,
			snapshot: `
let value: string | null = null;
const result = value ? value : "default";
               ~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over ternary expression for nullish checks.
`,
		},
		{
			code: `
let value: number | undefined = undefined;
const result = !value ? "default" : value;
`,
			output: `
let value: number | undefined = undefined;
const result = value ?? "default";
`,
			snapshot: `
let value: number | undefined = undefined;
const result = !value ? "default" : value;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over ternary expression for nullish checks.
`,
		},
		{
			code: `
declare const values: Set<string> | undefined;
function emptiness() {
    return values !== undefined ? values.has("") : true;
}
`,
			output: `
declare const values: Set<string> | undefined;
function emptiness() {
    return values?.has("") ?? true;
}
`,
			snapshot: `
declare const values: Set<string> | undefined;
function emptiness() {
    return values !== undefined ? values.has("") : true;
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           Prefer nullish coalescing operator (\`??\`) over ternary expression for nullish checks.
}
`,
		},
		{
			code: `
declare const obj: { key: string } | undefined;
const result = obj !== undefined ? obj["key"] : "default";
`,
			output: `
declare const obj: { key: string } | undefined;
const result = obj?.["key"] ?? "default";
`,
			snapshot: `
declare const obj: { key: string } | undefined;
const result = obj !== undefined ? obj["key"] : "default";
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over ternary expression for nullish checks.
`,
		},
		{
			code: `
declare const obj: { nested: { value: number } } | null;
const result = obj !== null ? obj.nested.value : 0;
`,
			output: `
declare const obj: { nested: { value: number } } | null;
const result = obj?.nested.value ?? 0;
`,
			snapshot: `
declare const obj: { nested: { value: number } } | null;
const result = obj !== null ? obj.nested.value : 0;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over ternary expression for nullish checks.
`,
		},
		{
			code: `
declare const arr: number[] | undefined;
const result = arr !== undefined ? arr.map(x => x * 2).filter(x => x > 0) : [];
`,
			output: `
declare const arr: number[] | undefined;
const result = arr?.map(x => x * 2).filter(x => x > 0) ?? [];
`,
			snapshot: `
declare const arr: number[] | undefined;
const result = arr !== undefined ? arr.map(x => x * 2).filter(x => x > 0) : [];
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer nullish coalescing operator (\`??\`) over ternary expression for nullish checks.
`,
		},
	],
	valid: [
		`
let value: string = "";
const result = value || "default";
`,
		`
let value: number = 0;
const result = value || 1;
`,
		`
let value: boolean = false;
const result = value || true;
`,
		`
let value = "text";
const result = value || "default";
`,
		`
let value: string | null = null;
const result = value ?? "default";
`,
		`
declare const value: 0 | null;
const result = value || 1;
`,
		`
declare const value: "" | undefined;
const result = value || "default";
`,
		`
declare const value: false | null;
const result = value || true;
`,
		`
declare const value: 0n | undefined;
const result = value || 1n;
`,
		`
let value: any = null;
const result = value || "default";
`,
		`
let value: unknown = null;
const result = value || "default";
`,
		`
let value: string = "test";
const result = value ? value : "default";
`,
		`
declare let x: string | boolean;
const result = x ? x : "default";
`,
		`
let foo: string | null = null;
function test() {
  if (!foo) {
    foo = "default";
  } else {
    console.log(foo);
  }
}
`,
		`
let obj = { value: "test" };
const result = obj.value || "default";
`,
		`
declare const baseHost: string[] | null;
console.log(baseHost == null ? { cwd: process.cwd() } : { baseHost });
`,
	],
});
