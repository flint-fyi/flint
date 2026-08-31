import { ruleTester } from "./ruleTester.ts";
import rule from "./structuredCloneMethods.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const obj: { value: number };

const clone = JSON.parse(JSON.stringify(obj));
void clone;
`,
			snapshot: `
declare const obj: { value: number };

const clone = JSON.parse(JSON.stringify(obj));
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`structuredClone()\` over \`JSON.parse(JSON.stringify())\`.
void clone;
`,
		},
		{
			code: `
function deepCopy<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}
deepCopy({ value: 1 });
`,
			snapshot: `
function deepCopy<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           Prefer \`structuredClone()\` over \`JSON.parse(JSON.stringify())\`.
}
deepCopy({ value: 1 });
`,
		},
		{
			code: `
declare const state: { items: string[] };

const data = JSON.parse(JSON.stringify(state.items));
void data;
`,
			snapshot: `
declare const state: { items: string[] };

const data = JSON.parse(JSON.stringify(state.items));
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer \`structuredClone()\` over \`JSON.parse(JSON.stringify())\`.
void data;
`,
		},
		{
			code: `
export const copy = JSON.parse(JSON.stringify({ a: 1 }));
`,
			snapshot: `
export const copy = JSON.parse(JSON.stringify({ a: 1 }));
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    Prefer \`structuredClone()\` over \`JSON.parse(JSON.stringify())\`.
`,
		},
	],
	valid: [
		`
declare const obj: { value: number };
declare function structuredClone<T>(value: T): T;

const clone = structuredClone(obj);
void clone;
`,
		`
declare const jsonString: string;

const parsed = JSON.parse(jsonString);
void parsed;
`,
		`
declare const obj: { value: number };

const stringified = JSON.stringify(obj);
void stringified;
`,
		`
declare const obj: { value: number };
declare const replacer: (key: string, value: unknown) => unknown;

const result = JSON.parse(JSON.stringify(obj, replacer));
void result;
`,
		`
declare const obj: { value: number };

const result = JSON.parse(JSON.stringify(obj, undefined, 2));
void result;
`,
		`
declare const obj: { value: number };
declare const reviver: (key: string, value: unknown) => unknown;

const result = JSON.parse(JSON.stringify(obj), reviver);
void result;
`,
		`
declare function getData(): string;

const result = JSON.parse(getData());
void result;
`,
		`
declare const items: [unknown];

const result = JSON.parse(JSON.stringify(...items));
void result;
`,
		`
declare const JSON: {
   parse(value: string): unknown;
   stringify(value: unknown): string;
}
const result = JSON.parse(JSON.stringify({}));
void result;
`,
	],
});
