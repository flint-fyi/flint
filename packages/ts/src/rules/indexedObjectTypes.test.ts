import rule from "./indexedObjectTypes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		// Default style: "record" - reports index signatures
		{
			code: `
interface Data { [key: string]: number; }
`,
			snapshot: `
interface Data { [key: string]: number; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
type Data = { [key: string]: number };
`,
			snapshot: `
type Data = { [key: string]: number };
            ~~~~~~~~~~~~~~~~~~~~~~~~~
            Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
interface StringMap { [key: string]: string; }
`,
			snapshot: `
interface StringMap { [key: string]: string; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`Record<K, V>\` over an index signature.
`,
		},
		{
			code: `
type NumberMap = { [index: number]: boolean };
`,
			snapshot: `
type NumberMap = { [index: number]: boolean };
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 Prefer \`Record<K, V>\` over an index signature.
`,
		},
		// Readonly index signature
		{
			code: `
interface ReadonlyData { readonly [key: string]: number; }
`,
			snapshot: `
interface ReadonlyData { readonly [key: string]: number; }
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Prefer \`Record<K, V>\` over an index signature.
`,
		},
		// Inline type literal
		{
			code: `
function process(data: { [key: string]: number }): void {}
`,
			snapshot: `
function process(data: { [key: string]: number }): void {}
                       ~~~~~~~~~~~~~~~~~~~~~~~~~
                       Prefer \`Record<K, V>\` over an index signature.
`,
		},
		// Style: "index-signature" - reports Record<K, V>
		{
			code: `
type Data = Record<string, number>;
`,
			options: { style: "index-signature" },
			snapshot: `
type Data = Record<string, number>;
            ~~~~~~~~~~~~~~~~~~~~~~
            Prefer an index signature over \`Record<K, V>\`.
`,
		},
		{
			code: `
const values: Record<string, boolean> = {};
`,
			options: { style: "index-signature" },
			snapshot: `
const values: Record<string, boolean> = {};
              ~~~~~~~~~~~~~~~~~~~~~~~
              Prefer an index signature over \`Record<K, V>\`.
`,
		},
		{
			code: `
function process(data: Record<number, string>): void {}
`,
			options: { style: "index-signature" },
			snapshot: `
function process(data: Record<number, string>): void {}
                       ~~~~~~~~~~~~~~~~~~~~~~
                       Prefer an index signature over \`Record<K, V>\`.
`,
		},
	],
	valid: [
		// Default style: "record" - allows Record<K, V>
		`type Data = Record<string, number>;`,
		`const values: Record<string, boolean> = {};`,
		`function process(data: Record<number, string>): void {}`,

		// Interface with multiple members (not just index signature)
		`
interface Data {
    name: string;
    [key: string]: unknown;
}
`,

		// Interface with no members
		`interface Empty {}`,

		// Interface with extends clause (skip)
		`
interface Extended extends Base {
    [key: string]: number;
}
`,

		// Circular/recursive types should be skipped
		`type Node = { [key: string]: Node };`,
		`type Tree = { [key: string]: Tree | string };`,
		`interface Recursive { [key: string]: Recursive; }`,
		`type Nested = { [key: string]: Nested[] };`,
		`type Conditional<T> = { [key: string]: T extends true ? Conditional<T> : number };`,

		// Non-single index signature
		`
type MultiMember = {
    name: string;
    [key: string]: string;
};
`,

		// Style: "index-signature" - allows index signatures
		{
			code: `interface Data { [key: string]: number; }`,
			options: { style: "index-signature" },
		},
		{
			code: `type Data = { [key: string]: number };`,
			options: { style: "index-signature" },
		},

		// Custom Record type (not global)
		`
type Record<K, V> = { custom: true };
const data: Record<string, number> = { custom: true };
export {};
`,

		// Record with wrong number of type arguments
		{
			code: `type Data = Record<string>;`,
			options: { style: "index-signature" },
		},
		{
			code: `type Data = Record<string, number, boolean>;`,
			options: { style: "index-signature" },
		},

		// Empty type literal
		`type Empty = {};`,

		// Mapped type (not an index signature)
		`type Mapped = { [K in keyof T]: T[K] };`,
	],
});
