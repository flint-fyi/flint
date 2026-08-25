import rule from "./objectHasOwns.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const obj = { key: 1 };
const hasKey = obj.hasOwnProperty("key");
void hasKey;
`,
			snapshot: `
const obj = { key: 1 };
const hasKey = obj.hasOwnProperty("key");
               ~~~~~~~~~~~~~~~~~~~~~~~~~
               \`hasOwnProperty()\` calls can fail on objects without \`Object.prototype\` or with overridden properties.
void hasKey;
`,
		},
		{
			code: `
const obj = { prop: 1 };

if (obj.hasOwnProperty("prop")) {
    const message = "Has property";
    void message;
}
`,
			snapshot: `
const obj = { prop: 1 };

if (obj.hasOwnProperty("prop")) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~
    \`hasOwnProperty()\` calls can fail on objects without \`Object.prototype\` or with overridden properties.
    const message = "Has property";
    void message;
}
`,
		},
		{
			code: `
const obj = { key: 1 };
const result = Object.prototype.hasOwnProperty.call(obj, "key");
void result;
`,
			snapshot: `
const obj = { key: 1 };
const result = Object.prototype.hasOwnProperty.call(obj, "key");
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               \`hasOwnProperty()\` calls can fail on objects without \`Object.prototype\` or with overridden properties.
void result;
`,
		},
		{
			code: `
const obj = { prop: 1 };

if (Object.prototype.hasOwnProperty.call(obj, "prop")) {
    const message = "Has property";
    void message;
}
`,
			snapshot: `
const obj = { prop: 1 };

if (Object.prototype.hasOwnProperty.call(obj, "prop")) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    \`hasOwnProperty()\` calls can fail on objects without \`Object.prototype\` or with overridden properties.
    const message = "Has property";
    void message;
}
`,
		},
		{
			code: `
const obj = { key: 1 };
const hasKey = {}.hasOwnProperty.call(obj, "key");
void hasKey;
`,
			snapshot: `
const obj = { key: 1 };
const hasKey = {}.hasOwnProperty.call(obj, "key");
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               \`hasOwnProperty()\` calls can fail on objects without \`Object.prototype\` or with overridden properties.
void hasKey;
`,
		},
		{
			code: `
const obj = { prop: 1 };

if ({}.hasOwnProperty.call(obj, "prop")) {
    const message = "Has property";
    void message;
}
`,
			snapshot: `
const obj = { prop: 1 };

if ({}.hasOwnProperty.call(obj, "prop")) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    \`hasOwnProperty()\` calls can fail on objects without \`Object.prototype\` or with overridden properties.
    const message = "Has property";
    void message;
}
`,
		},
		{
			code: `
declare const key: string;
declare const someObj: object;

const value = someObj.hasOwnProperty(key);
void value;
`,
			snapshot: `
declare const key: string;
declare const someObj: object;

const value = someObj.hasOwnProperty(key);
              ~~~~~~~~~~~~~~~~~~~~~~~~~~~
              \`hasOwnProperty()\` calls can fail on objects without \`Object.prototype\` or with overridden properties.
void value;
`,
		},
		{
			code: `
function check(obj: object, key: string) {
    return obj.hasOwnProperty(key);
}
check({ key: 1 }, "key");
`,
			snapshot: `
function check(obj: object, key: string) {
    return obj.hasOwnProperty(key);
           ~~~~~~~~~~~~~~~~~~~~~~~
           \`hasOwnProperty()\` calls can fail on objects without \`Object.prototype\` or with overridden properties.
}
check({ key: 1 }, "key");
`,
		},
	],
	valid: [
		`const obj = { key: 1 }; const hasKey = Object.hasOwn(obj, "key"); void hasKey;`,
		`
const obj = { prop: 1 };

if (Object.hasOwn(obj, "prop")) {
    const message = "Has property";
    void message;
}
`,
		`
const obj = { key: 1 };
const key = "key";
const result = Object.hasOwn(obj, key);
void result;
`,
		`function check(obj: object, key: string) { return Object.hasOwn(obj, key); } check({ key: 1 }, "key");`,
		`const obj = { key: 1 }; const descriptor = Object.getOwnPropertyDescriptor(obj, "key"); void descriptor;`,
		`const obj = { key: 1 }; const keys = Object.getOwnPropertyNames(obj); void keys;`,
		`const obj = { key: Symbol("key") }; const symbols = Object.getOwnPropertySymbols(obj); void symbols;`,
	],
});
