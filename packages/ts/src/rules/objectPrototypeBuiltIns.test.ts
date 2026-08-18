import rule from "./objectPrototypeBuiltIns.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const object = { key: 1 };
const has = object.hasOwnProperty("key");
`,
			snapshot: `
const object = { key: 1 };
const has = object.hasOwnProperty("key");
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Prefer the safer \`Object.prototype.hasOwnProperty.call()\` over calling \`hasOwnProperty()\` directly on objects.
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
const object = { key: 1 };
const has = Object.prototype.hasOwnProperty.call(object, "key");
`,
				},
			],
		},
		{
			code: `
const object = {};
const other = {};

const isPrototype = object.isPrototypeOf(other);
`,
			snapshot: `
const object = {};
const other = {};

const isPrototype = object.isPrototypeOf(other);
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    Prefer the safer \`Object.prototype.isPrototypeOf.call()\` over calling \`isPrototypeOf()\` directly on objects.
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
const object = {};
const other = {};

const isPrototype = Object.prototype.isPrototypeOf.call(object, other);
`,
				},
			],
		},
		{
			code: `
const object = { prop: 1 };
const isEnum = object.propertyIsEnumerable("prop");
`,
			snapshot: `
const object = { prop: 1 };
const isEnum = object.propertyIsEnumerable("prop");
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer the safer \`Object.prototype.propertyIsEnumerable.call()\` over calling \`propertyIsEnumerable()\` directly on objects.
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
const object = { prop: 1 };
const isEnum = Object.prototype.propertyIsEnumerable.call(object, "prop");
`,
				},
			],
		},
		{
			code: `
const data: Record<string, unknown> = {};
const key = "key";
declare function processValue(value: unknown): void;

if (data.hasOwnProperty(key)) {
    processValue(data[key]);
}
`,
			snapshot: `
const data: Record<string, unknown> = {};
const key = "key";
declare function processValue(value: unknown): void;

if (data.hasOwnProperty(key)) {
    ~~~~~~~~~~~~~~~~~~~~~~~~
    Prefer the safer \`Object.prototype.hasOwnProperty.call()\` over calling \`hasOwnProperty()\` directly on objects.
    processValue(data[key]);
}
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
const data: Record<string, unknown> = {};
const key = "key";
declare function processValue(value: unknown): void;

if (Object.prototype.hasOwnProperty.call(data, key)) {
    processValue(data[key]);
}
`,
				},
			],
		},
		{
			code: `
const object = { key: 1 };
const has = object.hasOwnProperty/* comment */("key");
`,
			snapshot: `
const object = { key: 1 };
const has = object.hasOwnProperty/* comment */("key");
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Prefer the safer \`Object.prototype.hasOwnProperty.call()\` over calling \`hasOwnProperty()\` directly on objects.
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
const object = { key: 1 };
const has = Object.prototype.hasOwnProperty.call(object, "key");
`,
				},
			],
		},
		{
			code: `
const object = { key: 1 };
const has = object.hasOwnProperty/* :( */("key");
`,
			snapshot: `
const object = { key: 1 };
const has = object.hasOwnProperty/* :( */("key");
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Prefer the safer \`Object.prototype.hasOwnProperty.call()\` over calling \`hasOwnProperty()\` directly on objects.
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
const object = { key: 1 };
const has = Object.prototype.hasOwnProperty.call(object, "key");
`,
				},
			],
		},
		{
			code: `
const object = { key: 1 };
const has = object.hasOwnProperty(/* comment */ "key");
`,
			snapshot: `
const object = { key: 1 };
const has = object.hasOwnProperty(/* comment */ "key");
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Prefer the safer \`Object.prototype.hasOwnProperty.call()\` over calling \`hasOwnProperty()\` directly on objects.
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
const object = { key: 1 };
const has = Object.prototype.hasOwnProperty.call(object, /* comment */ "key");
`,
				},
			],
		},
	],
	valid: [
		`const object = { key: 1 }; const has = Object.prototype.hasOwnProperty.call(object, "key");`,
		`const object = {}; const other = {}; const isPrototype = Object.prototype.isPrototypeOf.call(object, other);`,
		`const object = { prop: 1 }; const isEnum = {}.propertyIsEnumerable.call(object, "prop");`,
		`const object = { someOtherMethod(key: string) { return key; } }; const value = object.someOtherMethod("key");`,
		`function hasOwnProperty(key: string) { return key.length > 0; } const result = hasOwnProperty("key");`,
	],
});
