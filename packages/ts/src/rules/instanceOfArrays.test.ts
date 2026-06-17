import rule from "./instanceOfArrays.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: object;
value instanceof Array;
export {};
`,
			snapshot: `
declare const value: object;
value instanceof Array;
~~~~~~~~~~~~~~~~~~~~~~
Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
		{
			code: `
declare const input: object;
if (input instanceof Array) {}
export {};
`,
			snapshot: `
declare const input: object;
if (input instanceof Array) {}
    ~~~~~~~~~~~~~~~~~~~~~~
    Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
		{
			code: `
declare const data: object;
const isArray = data instanceof Array;
export {};
`,
			snapshot: `
declare const data: object;
const isArray = data instanceof Array;
                ~~~~~~~~~~~~~~~~~~~~~
                Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
		{
			code: `
declare const items: object;
(items) instanceof Array;
export {};
`,
			snapshot: `
declare const items: object;
(items) instanceof Array;
~~~~~~~~~~~~~~~~~~~~~~~~
Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
		{
			code: `
declare const value: object;
value instanceof (Array);
export {};
`,
			snapshot: `
declare const value: object;
value instanceof (Array);
~~~~~~~~~~~~~~~~~~~~~~~~
Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
		{
			code: `
declare const obj: { property: object };
obj.property instanceof Array;
export {};
`,
			snapshot: `
declare const obj: { property: object };
obj.property instanceof Array;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
		{
			code: `
declare const value: object;
!(value instanceof Array);
export {};
`,
			snapshot: `
declare const value: object;
!(value instanceof Array);
  ~~~~~~~~~~~~~~~~~~~~~~
  Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
	],
	valid: [
		`
declare const value: object;
Array.isArray(value);
export {};
`,
		`
declare const value: object;
value instanceof Object;
export {};
`,
		`
declare const value: object;
value instanceof Map;
export {};
`,
		`
declare const value: object;
value instanceof Set;
export {};
`,
		`
declare class MyArray {}
declare const value: object;
value instanceof MyArray;
export {};
`,
		`
declare namespace ns {
	class Array {}
}
declare const value: object;
value instanceof ns.Array;
export {};
`,
		`
class Array {}
declare const value: object;
value instanceof Array;
export {};
`,
		`
const Array = class {};
declare const value: object;
value instanceof Array;
export {};
`,
		`
function Array() {}
declare const value: object;
value instanceof Array;
export {};
`,
	],
});
