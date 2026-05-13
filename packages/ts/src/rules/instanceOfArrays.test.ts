import rule from "./instanceOfArrays.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
value instanceof Array;
export {};
`,
			snapshot: `
value instanceof Array;
~~~~~~~~~~~~~~~~~~~~~~
Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
		{
			code: `
if (input instanceof Array) {}
export {};
`,
			snapshot: `
if (input instanceof Array) {}
    ~~~~~~~~~~~~~~~~~~~~~~
    Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
		{
			code: `
const isArray = data instanceof Array;
export {};
`,
			snapshot: `
const isArray = data instanceof Array;
                ~~~~~~~~~~~~~~~~~~~~~
                Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
		{
			code: `
(items) instanceof Array;
export {};
`,
			snapshot: `
(items) instanceof Array;
~~~~~~~~~~~~~~~~~~~~~~~~
Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
		{
			code: `
value instanceof (Array);
export {};
`,
			snapshot: `
value instanceof (Array);
~~~~~~~~~~~~~~~~~~~~~~~~
Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
		{
			code: `
obj.property instanceof Array;
export {};
`,
			snapshot: `
obj.property instanceof Array;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
		{
			code: `
!(value instanceof Array);
export {};
`,
			snapshot: `
!(value instanceof Array);
  ~~~~~~~~~~~~~~~~~~~~~~
  Use \`Array.isArray()\` instead of \`instanceof Array\`.
export {};
`,
		},
	],
	valid: [
		`Array.isArray(value); export {};`,
		`value instanceof Object; export {};`,
		`value instanceof Map; export {};`,
		`value instanceof Set; export {};`,
		`value instanceof MyArray; export {};`,
		`value instanceof ns.Array; export {};`,
		`
class Array {}
value instanceof Array;
export {};
`,
		`
const Array = class {};
value instanceof Array;
export {};
`,
		`
function Array() {}
value instanceof Array;
export {};
`,
	],
});
