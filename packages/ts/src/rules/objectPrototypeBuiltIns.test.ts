import rule from "./objectPrototypeBuiltIns.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const has = object.hasOwnProperty("key");
`,
			snapshot: `
const has = object.hasOwnProperty("key");
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Prefer the safer \`Object.prototype.hasOwnProperty.call()\` over calling \`hasOwnProperty()\` directly on objects.
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
const has = Object.prototype.hasOwnProperty.call(object, "key");
`,
				},
			],
		},
		{
			code: `
const isPrototype = object.isPrototypeOf(other);
`,
			snapshot: `
const isPrototype = object.isPrototypeOf(other);
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    Prefer the safer \`Object.prototype.isPrototypeOf.call()\` over calling \`isPrototypeOf()\` directly on objects.
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
const isPrototype = Object.prototype.isPrototypeOf.call(object, other);
`,
				},
			],
		},
		{
			code: `
const isEnum = object.propertyIsEnumerable("prop");
`,
			snapshot: `
const isEnum = object.propertyIsEnumerable("prop");
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               Prefer the safer \`Object.prototype.propertyIsEnumerable.call()\` over calling \`propertyIsEnumerable()\` directly on objects.
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
const isEnum = Object.prototype.propertyIsEnumerable.call(object, "prop");
`,
				},
			],
		},
		{
			code: `
if (data.hasOwnProperty(key)) {
    process(data[key]);
}
`,
			snapshot: `
if (data.hasOwnProperty(key)) {
    ~~~~~~~~~~~~~~~~~~~~~~~~
    Prefer the safer \`Object.prototype.hasOwnProperty.call()\` over calling \`hasOwnProperty()\` directly on objects.
    process(data[key]);
}
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
if (Object.prototype.hasOwnProperty.call(data, key)) {
    process(data[key]);
}
`,
				},
			],
		},
		{
			code: `
const has = object.hasOwnProperty/* comment */("key");
`,
			snapshot: `
const has = object.hasOwnProperty/* comment */("key");
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Prefer the safer \`Object.prototype.hasOwnProperty.call()\` over calling \`hasOwnProperty()\` directly on objects.
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
const has = Object.prototype.hasOwnProperty.call(object, "key");
`,
				},
			],
		},
		{
			code: `
const has = object.hasOwnProperty/* :( */("key");
`,
			snapshot: `
const has = object.hasOwnProperty/* :( */("key");
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Prefer the safer \`Object.prototype.hasOwnProperty.call()\` over calling \`hasOwnProperty()\` directly on objects.
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
const has = Object.prototype.hasOwnProperty.call(object, "key");
`,
				},
			],
		},
		{
			code: `
const has = object.hasOwnProperty(/* comment */ "key");
`,
			snapshot: `
const has = object.hasOwnProperty(/* comment */ "key");
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Prefer the safer \`Object.prototype.hasOwnProperty.call()\` over calling \`hasOwnProperty()\` directly on objects.
`,
			suggestions: [
				{
					id: "usePrototypeCall",
					updated: `
const has = Object.prototype.hasOwnProperty.call(object, /* comment */ "key");
`,
				},
			],
		},
	],
	valid: [
		`const has = Object.prototype.hasOwnProperty.call(object, "key");`,
		`const isPrototype = Object.prototype.isPrototypeOf.call(object, other);`,
		`const isEnum = {}.propertyIsEnumerable.call(object, "prop");`,
		`const value = object.someOtherMethod("key");`,
		`const result = hasOwnProperty("key");`,
	],
});
