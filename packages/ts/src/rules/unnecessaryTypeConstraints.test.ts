import rule from "./unnecessaryTypeConstraints.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function data<T extends any>() {}
`,
			snapshot: `
function data<T extends any>() {}
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
		},
		{
			code: `
function data<T extends any, U>() {}
`,
			snapshot: `
function data<T extends any, U>() {}
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
		},
		{
			code: `
function data<T, U extends any>() {}
`,
			snapshot: `
function data<T, U extends any>() {}
                  ~~~~~~~~~~~~
                  Constraining the generic type \`U\` to \`any\` does nothing and is unnecessary.
`,
		},
		{
			code: `
function data<T extends any, U extends T>() {}
`,
			snapshot: `
function data<T extends any, U extends T>() {}
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
		},
		{
			code: `
const data = <T extends any>() => {};
`,
			snapshot: `
const data = <T extends any>() => {};
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
		},
		{
			code: `
const data = <T extends any = unknown>() => {};
`,
			snapshot: `
const data = <T extends any = unknown>() => {};
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
		},
		{
			code: `
const data = <T extends any, U extends any>() => {};
`,
			snapshot: `
const data = <T extends any, U extends any>() => {};
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
                              ~~~~~~~~~~~~
                              Constraining the generic type \`U\` to \`any\` does nothing and is unnecessary.
`,
		},
		{
			code: `
function data<T extends unknown>() {}
`,
			snapshot: `
function data<T extends unknown>() {}
               ~~~~~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`unknown\` does nothing and is unnecessary.
`,
		},
		{
			code: `
const data = <T extends unknown>() => {};
`,
			snapshot: `
const data = <T extends unknown>() => {};
               ~~~~~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`unknown\` does nothing and is unnecessary.
`,
		},
		{
			code: `
class Data<T extends unknown> {}
`,
			snapshot: `
class Data<T extends unknown> {}
            ~~~~~~~~~~~~~~~~
            Constraining the generic type \`T\` to \`unknown\` does nothing and is unnecessary.
`,
		},
		{
			code: `
const Data = class<T extends unknown> {};
`,
			snapshot: `
const Data = class<T extends unknown> {};
                    ~~~~~~~~~~~~~~~~
                    Constraining the generic type \`T\` to \`unknown\` does nothing and is unnecessary.
`,
		},
		{
			code: `
class Data {
    member<T extends unknown>() {}
}
`,
			snapshot: `
class Data {
    member<T extends unknown>() {}
            ~~~~~~~~~~~~~~~~
            Constraining the generic type \`T\` to \`unknown\` does nothing and is unnecessary.
}
`,
		},
		{
			code: `
const Data = class {
    member<T extends unknown>() {}
};
`,
			snapshot: `
const Data = class {
    member<T extends unknown>() {}
            ~~~~~~~~~~~~~~~~
            Constraining the generic type \`T\` to \`unknown\` does nothing and is unnecessary.
};
`,
		},
		{
			code: `
interface Data<T extends unknown> {}
`,
			snapshot: `
interface Data<T extends unknown> {}
                ~~~~~~~~~~~~~~~~
                Constraining the generic type \`T\` to \`unknown\` does nothing and is unnecessary.
`,
		},
		{
			code: `
type Data<T extends unknown> = {};
`,
			snapshot: `
type Data<T extends unknown> = {};
           ~~~~~~~~~~~~~~~~
           Constraining the generic type \`T\` to \`unknown\` does nothing and is unnecessary.
`,
		},
	],
	valid: [
		"function data() {}",
		"function data<T>() {}",
		"function data<T, U>() {}",
		"function data<T extends number>() {}",
		"function data<T extends number | string>() {}",
		"function data<T extends any | number>() {}",
		`
type TODO = any;
function data<T extends TODO>() {}
`,
		"const data = () => {};",
		"const data = <T,>() => {};",
		"const data = <T, U>() => {};",
		"const data = <T extends number>() => {};",
		"const data = <T extends number | string>() => {};",
	],
});
