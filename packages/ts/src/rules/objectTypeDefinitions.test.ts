import rule from "./objectTypeDefinitions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
type Point = { x: number; y: number };
`,
			snapshot: `
type Point = { x: number; y: number };
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
export type Box<Value> = {
    value: Value;
};
`,
			snapshot: `
export type Box<Value> = {
       ~~~~
       Type aliases for object types have different behavior from interfaces in some cases.
    value: Value;
};
`,
		},
		{
			code: `
declare type Callable = {
    (): void;
    name: string;
};
`,
			snapshot: `
declare type Callable = {
        ~~~~
        Type aliases for object types have different behavior from interfaces in some cases.
    (): void;
    name: string;
};
`,
		},
		{
			code: `
function create() {
    type Options = { verbose: boolean };
    return {} as Options;
}
`,
			snapshot: `
function create() {
    type Options = { verbose: boolean };
    ~~~~
    Type aliases for object types have different behavior from interfaces in some cases.
    return {} as Options;
}
`,
		},
	],
	valid: [
		`interface Point { x: number; y: number }`,
		`type Identifier = string | number;`,
		`type Combined = { a: string } & { b: number };`,
		`type Either = { kind: "a" } | { kind: "b" };`,
		`type Handler = (value: string) => void;`,
		`type Flags = { [Key in "a" | "b"]: boolean };`,
		`type Points = { x: number }[];`,
		`type Mutable<Value> = { -readonly [Key in keyof Value]: Value[Key] };`,
	],
});
