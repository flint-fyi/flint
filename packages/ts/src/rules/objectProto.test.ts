import rule from "./objectProto.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const obj = Object.create(null) as { __proto__: object | null };
const proto = obj.__proto__;
`,
			snapshot: `
const obj = Object.create(null) as { __proto__: object | null };
const proto = obj.__proto__;
                  ~~~~~~~~~
                  Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
`,
		},
		{
			code: `
const obj = Object.create(null) as { __proto__: object | null };
const prototype = {};

obj.__proto__ = prototype;
`,
			snapshot: `
const obj = Object.create(null) as { __proto__: object | null };
const prototype = {};

obj.__proto__ = prototype;
    ~~~~~~~~~
    Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
`,
		},
		{
			code: `
const obj = Object.create(null) as { __proto__: object | null };

const descriptor = Object.getOwnPropertyDescriptor(obj, "__proto__");
const proto = obj.__proto__;
`,
			snapshot: `
const obj = Object.create(null) as { __proto__: object | null };

const descriptor = Object.getOwnPropertyDescriptor(obj, "__proto__");
const proto = obj.__proto__;
                  ~~~~~~~~~
                  Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
`,
		},
		{
			code: `
const obj = Object.create(null) as { __proto__: object | null };
const value = obj["__proto__"];
`,
			snapshot: `
const obj = Object.create(null) as { __proto__: object | null };
const value = obj["__proto__"];
                  ~~~~~~~~~~~
                  Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
`,
		},
		{
			code: `
const obj = Object.create(null) as { __proto__: object | null };
const prototype = {};

obj["__proto__"] = prototype;
`,
			snapshot: `
const obj = Object.create(null) as { __proto__: object | null };
const prototype = {};

obj["__proto__"] = prototype;
    ~~~~~~~~~~~
    Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
`,
		},
		{
			code: `
const obj = Object.create(null) as { __proto__: object | null };

if (obj.__proto__ === null) {
    const message = "No prototype";
    void message;
}
`,
			snapshot: `
const obj = Object.create(null) as { __proto__: object | null };

if (obj.__proto__ === null) {
        ~~~~~~~~~
        Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
    const message = "No prototype";
    void message;
}
`,
		},
		{
			code: `
function getProto(obj: { __proto__: unknown }) {
    return obj.__proto__;
}
`,
			snapshot: `
function getProto(obj: { __proto__: unknown }) {
    return obj.__proto__;
               ~~~~~~~~~
               Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
}
`,
		},
	],
	valid: [
		`const obj = {}; const proto = Object.getPrototypeOf(obj);`,
		`const obj = {}; const prototype = {}; Object.setPrototypeOf(obj, prototype);`,
		`const prototype = {}; const obj = Object.create(prototype);`,
		`const obj = {}; const descriptor = Object.getOwnPropertyDescriptor(obj, "__proto__");`,
		`const key = "__proto__";`,
		`const string = "obj.__proto__";`,
		`const obj = { "__proto__": null };`,
		`const obj = { __proto__: null };`,
	],
});
