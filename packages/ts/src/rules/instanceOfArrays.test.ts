import rule from "./instanceOfArrays.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: object;
value instanceof Array;
`,
			snapshot: `
declare const value: object;
value instanceof Array;
~~~~~~~~~~~~~~~~~~~~~~
Use \`Array.isArray()\` instead of \`instanceof Array\`.
`,
		},
		{
			code: `
declare const input: object;
if (input instanceof Array) {}
`,
			snapshot: `
declare const input: object;
if (input instanceof Array) {}
    ~~~~~~~~~~~~~~~~~~~~~~
    Use \`Array.isArray()\` instead of \`instanceof Array\`.
`,
		},
		{
			code: `
declare const data: object;
const isArray = data instanceof Array;
`,
			snapshot: `
declare const data: object;
const isArray = data instanceof Array;
                ~~~~~~~~~~~~~~~~~~~~~
                Use \`Array.isArray()\` instead of \`instanceof Array\`.
`,
		},
		{
			code: `
declare const items: object;
(items) instanceof Array;
`,
			snapshot: `
declare const items: object;
(items) instanceof Array;
~~~~~~~~~~~~~~~~~~~~~~~~
Use \`Array.isArray()\` instead of \`instanceof Array\`.
`,
		},
		{
			code: `
declare const value: object;
value instanceof (Array);
`,
			snapshot: `
declare const value: object;
value instanceof (Array);
~~~~~~~~~~~~~~~~~~~~~~~~
Use \`Array.isArray()\` instead of \`instanceof Array\`.
`,
		},
		{
			code: `
declare const obj: { property: object };
obj.property instanceof Array;
`,
			snapshot: `
declare const obj: { property: object };
obj.property instanceof Array;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use \`Array.isArray()\` instead of \`instanceof Array\`.
`,
		},
		{
			code: `
declare const value: object;
!(value instanceof Array);
`,
			snapshot: `
declare const value: object;
!(value instanceof Array);
  ~~~~~~~~~~~~~~~~~~~~~~
  Use \`Array.isArray()\` instead of \`instanceof Array\`.
`,
		},
	],
	valid: [
		`
declare const value: object;
Array.isArray(value);
`,
		`
declare const value: object;
value instanceof Object;
`,
		`
declare const value: object;
value instanceof Map;
`,
		`
declare const value: object;
value instanceof Set;
`,
		`
declare class MyArray {}
declare const value: object;
value instanceof MyArray;
`,
		`
declare namespace ns {
	class Array {}
}
declare const value: object;
value instanceof ns.Array;
`,
		`
class Array {}
declare const value: object;
value instanceof Array;
`,
		`
const Array = class {};
declare const value: object;
value instanceof Array;
`,
		`
function Array() {}
declare const value: object;
value instanceof Array;
`,
	],
});
