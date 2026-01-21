import rule from "./objectTypeDefinitions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
type Person = { name: string; age: number };
`,
			snapshot: `
type Person = { name: string; age: number };
~~~~
Type aliases for object types have different behavior from interfaces in some cases.
`,
		},
		{
			code: `
type Config = {
    host: string;
    port: number;
};
`,
			snapshot: `
type Config = {
~~~~
Type aliases for object types have different behavior from interfaces in some cases.
    host: string;
    port: number;
};
`,
		},
		{
			code: `
export type UserSettings = { theme: string; notifications: boolean };
`,
			snapshot: `
export type UserSettings = { theme: string; notifications: boolean };
       ~~~~
       Type aliases for object types have different behavior from interfaces in some cases.
`,
		},
		{
			code: `
type Empty = {};
`,
			snapshot: `
type Empty = {};
~~~~
Type aliases for object types have different behavior from interfaces in some cases.
`,
		},
		{
			code: `
type WithMethods = {
    getValue(): number;
    setValue(value: number): void;
};
`,
			snapshot: `
type WithMethods = {
~~~~
Type aliases for object types have different behavior from interfaces in some cases.
    getValue(): number;
    setValue(value: number): void;
};
`,
		},
		{
			code: `
type Nested = { inner: { value: string } };
`,
			snapshot: `
type Nested = { inner: { value: string } };
~~~~
Type aliases for object types have different behavior from interfaces in some cases.
`,
		},
		{
			code: `
type Generic<T> = { data: T };
`,
			snapshot: `
type Generic<T> = { data: T };
~~~~
Type aliases for object types have different behavior from interfaces in some cases.
`,
		},
		{
			code: `
type WithOptional = { required: string; optional?: number };
`,
			snapshot: `
type WithOptional = { required: string; optional?: number };
~~~~
Type aliases for object types have different behavior from interfaces in some cases.
`,
		},
		{
			code: `
type WithReadonly = { readonly id: string };
`,
			snapshot: `
type WithReadonly = { readonly id: string };
~~~~
Type aliases for object types have different behavior from interfaces in some cases.
`,
		},
		{
			code: `
type IndexSignature = { [key: string]: number };
`,
			snapshot: `
type IndexSignature = { [key: string]: number };
~~~~
Type aliases for object types have different behavior from interfaces in some cases.
`,
		},
	],
	valid: [
		`interface Person { name: string; age: number }`,
		`interface Config { host: string; port: number }`,
		`export interface UserSettings { theme: string; notifications: boolean }`,
		`interface Empty {}`,
		`interface Generic<T> { data: T }`,
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
