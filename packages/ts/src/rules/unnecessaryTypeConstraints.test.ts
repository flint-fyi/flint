import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryTypeConstraints.ts";

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
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
function data<T>() {}
`,
				},
			],
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
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
function data<T, U>() {}
`,
				},
			],
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
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
function data<T, U>() {}
`,
				},
			],
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
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
function data<T, U extends T>() {}
`,
				},
			],
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
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
const data = <T>() => {};
`,
				},
			],
		},
		{
			code: `
const data = <T extends any>() => {};
`,
			fileName: "file.tsx",
			snapshot: `
const data = <T extends any>() => {};
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
const data = <T,>() => {};
`,
				},
			],
		},
		{
			code: `
const data = <T extends any>() => {};
`,
			fileName: "file.mts",
			snapshot: `
const data = <T extends any>() => {};
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
const data = <T,>() => {};
`,
				},
			],
		},
		{
			code: `
const data = <T extends any>() => {};
`,
			fileName: "file.cts",
			snapshot: `
const data = <T extends any>() => {};
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
const data = <T,>() => {};
`,
				},
			],
		},
		{
			code: `
const data = <T extends any,>() => {};
`,
			fileName: "file.tsx",
			snapshot: `
const data = <T extends any,>() => {};
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
const data = <T,>() => {};
`,
				},
			],
		},
		{
			code: `
const data = <T extends any, >() => {};
`,
			fileName: "file.tsx",
			snapshot: `
const data = <T extends any, >() => {};
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
const data = <T, >() => {};
`,
				},
			],
		},
		{
			code: `
const data = <T extends any ,>() => {};
`,
			fileName: "file.tsx",
			snapshot: `
const data = <T extends any ,>() => {};
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
const data = <T ,>() => {};
`,
				},
			],
		},
		{
			code: `
const data = <T extends any , >() => {};
`,
			fileName: "file.tsx",
			snapshot: `
const data = <T extends any , >() => {};
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
const data = <T , >() => {};
`,
				},
			],
		},
		{
			code: `
const data = <T extends any = unknown>() => {};
`,
			fileName: "file.tsx",
			snapshot: `
const data = <T extends any = unknown>() => {};
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
const data = <T = unknown>() => {};
`,
				},
			],
		},
		{
			code: `
const data = <T extends any, U extends any>() => {};
`,
			fileName: "file.tsx",
			snapshot: `
const data = <T extends any, U extends any>() => {};
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
                              ~~~~~~~~~~~~
                              Constraining the generic type \`U\` to \`any\` does nothing and is unnecessary.
`,
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
const data = <T, U extends any>() => {};
`,
				},
				{
					id: "removeConstraint",
					updated: `
const data = <T extends any, U>() => {};
`,
				},
			],
		},
		{
			code: `
function data<T extends any>() {}
`,
			fileName: "file.tsx",
			snapshot: `
function data<T extends any>() {}
               ~~~~~~~~~~~~
               Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
function data<T>() {}
`,
				},
			],
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
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
function data<T>() {}
`,
				},
			],
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
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
const data = <T>() => {};
`,
				},
			],
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
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
class Data<T> {}
`,
				},
			],
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
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
const Data = class<T> {};
`,
				},
			],
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
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
class Data {
    member<T>() {}
}
`,
				},
			],
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
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
const Data = class {
    member<T>() {}
};
`,
				},
			],
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
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
interface Data<T> {}
`,
				},
			],
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
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
type Data<T> = {};
`,
				},
			],
		},
		{
			code: `
type Mapper = <T extends any>(value: T) => T;
`,
			snapshot: `
type Mapper = <T extends any>(value: T) => T;
                ~~~~~~~~~~~~
                Constraining the generic type \`T\` to \`any\` does nothing and is unnecessary.
`,
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
type Mapper = <T>(value: T) => T;
`,
				},
			],
		},
		{
			code: `
type Creator = new <T extends unknown>() => T;
`,
			snapshot: `
type Creator = new <T extends unknown>() => T;
                     ~~~~~~~~~~~~~~~~
                     Constraining the generic type \`T\` to \`unknown\` does nothing and is unnecessary.
`,
			suggestions: [
				{
					id: "removeConstraint",
					updated: `
type Creator = new <T>() => T;
`,
				},
			],
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
		"type AnyKeys = { [Key in any]: number };",
		"type Inferred<T> = T extends (infer Element extends any) ? Element : never;",
	],
});
