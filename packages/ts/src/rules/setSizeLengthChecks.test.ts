import { ruleTester } from "./ruleTester.ts";
import rule from "./setSizeLengthChecks.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const items: readonly number[];

const count = [...new Set(items)].length;
void count;
`,
			snapshot: `
declare const items: readonly number[];

const count = [...new Set(items)].length;
              ~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Set.size\` instead of spreading into an array and accessing \`.length\`.
void count;
`,
		},
		{
			code: `
const uniqueItems = new Set([1, 2, 3]);
const count = [...uniqueItems].length;
void count;
`,
			snapshot: `
const uniqueItems = new Set([1, 2, 3]);
const count = [...uniqueItems].length;
              ~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Set.size\` instead of spreading into an array and accessing \`.length\`.
void count;
`,
		},
		{
			code: `
declare const items: readonly number[];

const count = [...(new Set(items))].length;
void count;
`,
			snapshot: `
declare const items: readonly number[];

const count = [...(new Set(items))].length;
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`Set.size\` instead of spreading into an array and accessing \`.length\`.
void count;
`,
		},
		{
			code: `
declare const items: readonly number[];

const count = [
    ...new Set(items)
].length;
void count;
`,
			snapshot: `
declare const items: readonly number[];

const count = [
              ~
              Prefer \`Set.size\` instead of spreading into an array and accessing \`.length\`.
    ...new Set(items)
    ~~~~~~~~~~~~~~~~~
].length;
~~~~~~~~
void count;
`,
		},
		{
			code: `
declare const extra: number;
declare const items: readonly number[];

const result = [...new Set(items)].length + extra;
void result;
`,
			snapshot: `
declare const extra: number;
declare const items: readonly number[];

const result = [...new Set(items)].length + extra;
               ~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer \`Set.size\` instead of spreading into an array and accessing \`.length\`.
void result;
`,
		},
	],
	valid: [
		`
declare const items: readonly number[];

new Set(items).size;
`,
		`
declare const items: readonly number[];

const uniqueItems = new Set(items);
uniqueItems.size;
`,
		`
declare const items: readonly number[];

[...items].length;
`,
		`
declare const extra: number;
declare const items: readonly number[];

[...new Set(items), extra].length;
`,
		`
declare const items: readonly number[];

[...new Set(items)]?.length;
`,
		`
declare const items: readonly number[];

([...new Set(items)] as number[] & { notLength: number }).notLength;
`,
		`let items = new Set([]); [...items].length`,
		`
const items: unknown[] = [];

class Set {
    constructor(items: unknown[]) {
        void items;
    }
    length = 0;
    [Symbol.iterator]() {
        return [][Symbol.iterator]();
    }
}
const count = [...new Set(items)].length;
void count;
`,
	],
});
