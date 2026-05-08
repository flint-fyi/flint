import { ruleTester } from "./ruleTester.ts";
import rule from "./typeImports.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { Type } from "./types";
type Alias = Type & { extra: boolean };
`,
			snapshot: `
import { Type } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
type Alias = Type & { extra: boolean };
`,
		},
		{
			code: `
import { Type } from "./types";
interface Component {
    property: Type;
}
`,
			snapshot: `
import { Type } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
interface Component {
    property: Type;
}
`,
		},
		{
			code: `
import { Type } from "./types";
function setup(value: Type): void {}
`,
			snapshot: `
import { Type } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
function setup(value: Type): void {}
`,
		},
		{
			code: `
import Type from "./types";
type Alias = Type & { extra: boolean };
`,
			snapshot: `
import Type from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
type Alias = Type & { extra: boolean };
`,
		},
		{
			code: `
import * as Types from "./types";
type Alias = Types.Type;
`,
			snapshot: `
import * as Types from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
type Alias = Types.Type;
`,
		},
		{
			code: `
import { Type, createValue } from "./values";
type Alias = Type & { extra: boolean };
const value = createValue();
`,
			snapshot: `
import { Type, createValue } from "./values";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
type Alias = Type & { extra: boolean };
const value = createValue();
`,
		},
		{
			code: `
import { Type as AliasType, Role as Access } from "./types";
type Alias = AliasType & { access: Access };
`,
			snapshot: `
import { Type as AliasType, Role as Access } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
type Alias = AliasType & { access: Access };
`,
		},
		{
			code: `
import Type from "./types";
type TypeConstructor = typeof Type;
`,
			snapshot: `
import Type from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
type TypeConstructor = typeof Type;
`,
		},
		{
			code: `
import types from "./types";
type Alias = types.Type;
`,
			snapshot: `
import types from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
type Alias = types.Type;
`,
		},
		{
			code: `
import { Type } from "./types";
export type { Type };
`,
			snapshot: `
import { Type } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
export type { Type };
`,
		},
		{
			code: `
import Type from "./types";
export = {} as Type;
`,
			snapshot: `
import Type from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
export = {} as Type;
`,
		},
		{
			code: `
import { Type } from "./types";
class Value implements Type {}
`,
			snapshot: `
import { Type } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
class Value implements Type {}
`,
		},
		{
			code: `
import * as constants from "./constants";
type Values = {
    [constants.value]: readonly string[];
};
`,
			snapshot: `
import * as constants from "./constants";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
type Values = {
    [constants.value]: readonly string[];
};
`,
		},
		{
			code: `
type Type = import("./types").Type;
`,
			snapshot: `
type Type = import("./types").Type;
            ~~~~~~~~~~~~~~~~~~~~~~
            Prefer top-level imports over \`import()\` type annotations.
`,
		},
		{
			code: `
import type { Type } from "./types";
type Alias = Type;
`,
			options: { prefer: "no-type-imports" },
			snapshot: `
import type { Type } from "./types";
       ~~~~
       Use a regular import instead of a type-only import.
type Alias = Type;
`,
		},
		{
			code: `
import { type Type, createValue } from "./values";
type Alias = Type;
const value = createValue();
`,
			options: { prefer: "no-type-imports" },
			snapshot: `
import { type Type, createValue } from "./values";
         ~~~~~
         Use a regular import instead of a type-only import.
type Alias = Type;
const value = createValue();
`,
		},
		{
			code: `
import { Type, createValue, type Role } from "./values";
type Alias = Type & { role: Role };
const value = createValue();
`,
			snapshot: `
import { Type, createValue, type Role } from "./values";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
type Alias = Type & { role: Role };
const value = createValue();
`,
		},
		{
			code: `
import { Type, Role } from "./types";
type Alias = Type & { role: Role };
`,
			options: { fixStyle: "inline-type-imports" },
			snapshot: `
import { Type, Role } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Use 'import type' for type-only imports.
type Alias = Type & { role: Role };
`,
		},
	],
	valid: [
		`
import type { Type } from "./types";
type Alias = Type & { extra: boolean };
`,
		`
import type Type from "./types";
type Alias = Type & { extra: boolean };
`,
		`
import type * as Types from "./types";
type Alias = Types.Type & { extra: boolean };
`,
		`
import { type Type } from "./types";
type Alias = Type & { extra: boolean };
`,
		`
import { type Type, createValue } from "./values";
type Alias = Type & { extra: boolean };
const value = createValue();
`,
		`
import { createValue } from "./values";
const value = createValue();
`,
		`
import { Value } from "./values";
const value = new Value();
`,
		`
import { format } from "./utils";
console.log(format("hello"));
`,
		`
import { Component } from "./component";
export class MyComponent extends Component {}
`,
		`import { Type } from "./types";`,
		`
import Type from "./types";
type Box<Type> = Type;
`,
		`
import Type from "./types";
function wrap() {
    type Type = { name: string };
    let value: Type;
}
`,
		`
import Value from "./values";
export { Value };
export default Value;
`,
		`
import type Type from "./types";
export { Type };
export default Type;
export type { Type };
`,
		`
import * as values from "./values";
const value = values.createValue();
`,
		`
import type * as constants from "./constants";
export type Values = {
    [constants.value]: readonly string[];
};
`,
		`
import Value from "./values";
export = Value;
`,
		`
import type Type from "./types";
const value = Type;
`,
		{
			code: `
import React from "react";

export const Component: React.FC = () => <div />;
`,
		},
		{
			code: `
import { Fragment } from "react";

export const Component: Fragment = () => <>content</>;
`,
		},
		{
			code: `
import { Type } from "./types";
type Alias = Type & { extra: boolean };
`,
			options: { prefer: "no-type-imports" },
		},
	],
});
