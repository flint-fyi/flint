import { ruleTester } from "./ruleTester.ts";
import rule from "./structuredCloneMethods.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const clone = JSON.parse(JSON.stringify(obj));
`,
			snapshot: `
const clone = JSON.parse(JSON.stringify(obj));
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              Prefer \`structuredClone()\` over \`JSON.parse(JSON.stringify())\`.
`,
		},
		{
			code: `
function deepCopy<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}
`,
			snapshot: `
function deepCopy<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           Prefer \`structuredClone()\` over \`JSON.parse(JSON.stringify())\`.
}
`,
		},
		{
			code: `
const data = JSON.parse(JSON.stringify(state.items));
`,
			snapshot: `
const data = JSON.parse(JSON.stringify(state.items));
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             Prefer \`structuredClone()\` over \`JSON.parse(JSON.stringify())\`.
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
		`const clone = structuredClone(obj);`,
		`const parsed = JSON.parse(jsonString);`,
		`const str = JSON.stringify(obj);`,
		`const result = JSON.parse(JSON.stringify(obj, replacer));`,
		`const result = JSON.parse(JSON.stringify(obj, null, 2));`,
		`const result = JSON.parse(JSON.stringify(obj), reviver);`,
		`const result = JSON.parse(getData());`,
		`const result = JSON.parse(JSON.stringify());`,
		`const result = JSON.parse(JSON.stringify(...items));`,
		`
declare const JSON: {
   parse(value: string): unknown;
   stringify(value: unknown): string;
}
const result = JSON.parse(JSON.stringify({}));
export {};
`,
	],
});
