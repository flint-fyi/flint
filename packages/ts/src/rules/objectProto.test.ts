import rule from "./objectProto.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const proto = obj.__proto__;
`,
			snapshot: `
const proto = obj.__proto__;
                  ~~~~~~~~~
                  Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
`,
		},
		{
			code: `
obj.__proto__ = prototype;
`,
			snapshot: `
obj.__proto__ = prototype;
    ~~~~~~~~~
    Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
`,
		},
		{
			code: `
const descriptor = Object.getOwnPropertyDescriptor(obj, "__proto__");
const proto = obj.__proto__;
`,
			snapshot: `
const descriptor = Object.getOwnPropertyDescriptor(obj, "__proto__");
const proto = obj.__proto__;
                  ~~~~~~~~~
                  Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
`,
		},
		{
			code: `
const value = obj["__proto__"];
`,
			snapshot: `
const value = obj["__proto__"];
                  ~~~~~~~~~~~
                  Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
`,
		},
		{
			code: `
obj["__proto__"] = prototype;
`,
			snapshot: `
obj["__proto__"] = prototype;
    ~~~~~~~~~~~
    Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
`,
		},
		{
			code: `
if (obj.__proto__ === null) {
    console.log("No prototype");
}
`,
			snapshot: `
if (obj.__proto__ === null) {
        ~~~~~~~~~
        Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
    console.log("No prototype");
}
`,
		},
		{
			code: `
function getProto(obj: object) {
    return obj.__proto__;
}
`,
			snapshot: `
function getProto(obj: object) {
    return obj.__proto__;
               ~~~~~~~~~
               Use Object.getPrototypeOf or Object.setPrototypeOf instead of the deprecated __proto__ property.
}
`,
		},
	],
	valid: [
		`const proto = Object.getPrototypeOf(obj);`,
		`Object.setPrototypeOf(obj, prototype);`,
		`const obj = Object.create(prototype);`,
		`const descriptor = Object.getOwnPropertyDescriptor(obj, "__proto__");`,
		`const key = "__proto__";`,
		`const string = "obj.__proto__";`,
		`const obj = { "__proto__": null };`,
		`const obj = { __proto__: null };`,
	],
});
