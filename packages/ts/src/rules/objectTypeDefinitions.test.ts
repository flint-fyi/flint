import rule from "./objectTypeDefinitions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
type Person = { name: string; age: number };
`,
			output: `
interface Person { name: string; age: number };
`,
			snapshot: `
type Person = { name: string; age: number };
~~~~
This project prefers using an \`interface\` instead of a \`type\`.
`,
		},
		{
			code: `
type Config = {
    host: string;
    port: number;
};
`,
			output: `
interface Config {
    host: string;
    port: number;
};
`,
			snapshot: `
type Config = {
~~~~
This project prefers using an \`interface\` instead of a \`type\`.
    host: string;
    port: number;
};
`,
		},
		{
			code: `
export type UserSettings = { theme: string; notifications: boolean };
`,
			output: `
export interface UserSettings { theme: string; notifications: boolean };
`,
			snapshot: `
export type UserSettings = { theme: string; notifications: boolean };
       ~~~~
       This project prefers using an \`interface\` instead of a \`type\`.
`,
		},
		{
			code: `
type Empty = {};
`,
			output: `
interface Empty {};
`,
			snapshot: `
type Empty = {};
~~~~
This project prefers using an \`interface\` instead of a \`type\`.
`,
		},
		{
			code: `
type WithMethods = {
    getValue(): number;
    setValue(value: number): void;
};
`,
			output: `
interface WithMethods {
    getValue(): number;
    setValue(value: number): void;
};
`,
			snapshot: `
type WithMethods = {
~~~~
This project prefers using an \`interface\` instead of a \`type\`.
    getValue(): number;
    setValue(value: number): void;
};
`,
		},
		{
			code: `
type Nested = { inner: { value: string } };
`,
			output: `
interface Nested { inner: { value: string } };
`,
			snapshot: `
type Nested = { inner: { value: string } };
~~~~
This project prefers using an \`interface\` instead of a \`type\`.
`,
		},
		{
			code: `
type Generic<T> = { data: T };
`,
			output: `
interface Generic<T> { data: T };
`,
			snapshot: `
type Generic<T> = { data: T };
~~~~
This project prefers using an \`interface\` instead of a \`type\`.
`,
		},
		{
			code: `
type WithOptional = { required: string; optional?: number };
`,
			output: `
interface WithOptional { required: string; optional?: number };
`,
			snapshot: `
type WithOptional = { required: string; optional?: number };
~~~~
This project prefers using an \`interface\` instead of a \`type\`.
`,
		},
		{
			code: `
type WithReadonly = { readonly id: string };
`,
			output: `
interface WithReadonly { readonly id: string };
`,
			snapshot: `
type WithReadonly = { readonly id: string };
~~~~
This project prefers using an \`interface\` instead of a \`type\`.
`,
		},
		{
			code: `
type IndexSignature = { [key: string]: number };
`,
			output: `
interface IndexSignature { [key: string]: number };
`,
			snapshot: `
type IndexSignature = { [key: string]: number };
~~~~
This project prefers using an \`interface\` instead of a \`type\`.
`,
		},

		{
			code: `
interface Person { name: string; age: number }
`,
			options: { prefer: "type" },
			output: `
type Person = { name: string; age: number }
`,
			snapshot: `
interface Person { name: string; age: number }
          ~~~~~~
          This project prefers using a \`type\` instead of an \`interface\`.
`,
		},
		{
			code: `
interface Empty {}
`,
			options: { prefer: "type" },
			output: `
type Empty = {}
`,
			snapshot: `
interface Empty {}
          ~~~~~
          This project prefers using a \`type\` instead of an \`interface\`.
`,
		},
		{
			code: `
interface Config {
    host: string;
    port: number;
}
`,
			options: { prefer: "type" },
			output: `
type Config = {
    host: string;
    port: number;
}
`,
			snapshot: `
interface Config {
          ~~~~~~
          This project prefers using a \`type\` instead of an \`interface\`.
    host: string;
    port: number;
}
`,
		},
		{
			code: `
interface WithMethods {
    getValue(): number;
    setValue(value: number): void;
}
`,
			options: { prefer: "type" },
			output: `
type WithMethods = {
    getValue(): number;
    setValue(value: number): void;
}
`,
			snapshot: `
interface WithMethods {
          ~~~~~~~~~~~
          This project prefers using a \`type\` instead of an \`interface\`.
    getValue(): number;
    setValue(value: number): void;
}
`,
		},
		{
			code: `
interface Generic<T> { data: T }
`,
			options: { prefer: "type" },
			output: `
type Generic<T> = { data: T }
`,
			snapshot: `
interface Generic<T> { data: T }
          ~~~~~~~
          This project prefers using a \`type\` instead of an \`interface\`.
`,
		},
		{
			code: `
export interface Generic<T> { data: T }
`,
			options: { prefer: "type" },
			output: `
export type Generic<T> = { data: T }
`,
			snapshot: `
export interface Generic<T> { data: T }
                 ~~~~~~~
                 This project prefers using a \`type\` instead of an \`interface\`.
`,
		},
		{
			code: `
export interface Exported { value: string }
`,
			options: { prefer: "type" },
			output: `
export type Exported = { value: string }
`,
			snapshot: `
export interface Exported { value: string }
                 ~~~~~~~~
                 This project prefers using a \`type\` instead of an \`interface\`.
`,
		},
		{
			code: `
export declare interface ExportDeclared { value: string }
`,
			options: { prefer: "type" },
			output: `
export declare type ExportDeclared = { value: string }
`,
			snapshot: `
export declare interface ExportDeclared { value: string }
                         ~~~~~~~~~~~~~~
                         This project prefers using a \`type\` instead of an \`interface\`.
`,
		},
		{
			code: `
interface WithExtends extends Base { extra: string }
`,
			options: { prefer: "type" },
			output: `
type WithExtends = { extra: string } & Base
`,
			snapshot: `
interface WithExtends extends Base { extra: string }
          ~~~~~~~~~~~
          This project prefers using a \`type\` instead of an \`interface\`.
`,
		},
		{
			code: `
interface MultiExtends extends Base1, Base2 { extra: string }
`,
			options: { prefer: "type" },
			output: `
type MultiExtends = { extra: string } & Base1 & Base2
`,
			snapshot: `
interface MultiExtends extends Base1, Base2 { extra: string }
          ~~~~~~~~~~~~
          This project prefers using a \`type\` instead of an \`interface\`.
`,
		},
	],
	valid: [
		`interface Person { name: string; age: number }`,
		`interface Config { host: string; port: number }`,
		`export interface UserSettings { theme: string; notifications: boolean }`,
		`interface Empty {}`,
		`interface Generic<T> { data: T }`,
		`interface WithExtends extends Base { extra: string }`,
		`interface MultipleExtends extends Base1, Base2 { extra: string }`,
		`type StringAlias = string;`,
		`type NumberAlias = number;`,
		`type BooleanAlias = boolean;`,
		`type NullAlias = null;`,
		`type UndefinedAlias = undefined;`,
		`type VoidAlias = void;`,
		`type NeverAlias = never;`,
		`type UnknownAlias = unknown;`,
		`type AnyAlias = any;`,
		`type StringArray = string[];`,
		`type NumberArray = Array<number>;`,
		`type Tuple = [string, number];`,
		`type Union = string | number;`,
		`type Intersection = TypeA & TypeB;`,
		`type ObjectUnion = { a: string } | { b: number };`,
		`type ObjectIntersection = { a: string } & { b: number };`,
		`type Conditional<T> = T extends string ? "yes" : "no";`,
		`type Mapped<T> = { [K in keyof T]: T[K] };`,
		`type MappedReadonly<T> = { readonly [K in keyof T]: T[K] };`,
		`type TemplateLiteral = \`prefix-\${string}\`;`,
		`type FunctionType = (arg: string) => number;`,
		`type ConstructorType = new (arg: string) => object;`,
		`type TypeReference = Promise<string>;`,
		`type KeyofType = keyof SomeInterface;`,
		`type TypeofType = typeof someVariable;`,
		`type IndexedAccess = SomeType["property"];`,
		`type InferType<T> = T extends Array<infer U> ? U : never;`,
		`type LiteralString = "hello";`,
		`type LiteralNumber = 42;`,
		`type LiteralBoolean = true;`,
		`type BigIntType = bigint;`,
		`type SymbolType = symbol;`,
		`type ThisType = this;`,
		`type ImportType = import("./module").SomeType;`,
	],
});
