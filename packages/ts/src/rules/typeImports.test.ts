import { ruleTester } from "./ruleTester.ts";
import rule from "./typeImports.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { Type } from "./types";
type Alias = Type & { extra: boolean };
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import { type Type } from "./types";
type Alias = Type & { extra: boolean };
`,
			snapshot: `
import { Type } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All imports in this declaration are only used as types. Use 'import type'.
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
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import { type Type } from "./types";
interface Component {
    property: Type;
}
`,
			snapshot: `
import { Type } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All imports in this declaration are only used as types. Use 'import type'.
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
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import { type Type } from "./types";
function setup(value: Type): void {}
`,
			snapshot: `
import { Type } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All imports in this declaration are only used as types. Use 'import type'.
function setup(value: Type): void {}
`,
		},
		{
			code: `
import Type from "./types";
type Alias = Type & { extra: boolean };
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import type Type from "./types";
type Alias = Type & { extra: boolean };
`,
			snapshot: `
import Type from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~
All imports in this declaration are only used as types. Use 'import type'.
type Alias = Type & { extra: boolean };
`,
		},
		{
			code: `
import * as Types from "./types";
type Alias = Types.Type;
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import type * as Types from "./types";
type Alias = Types.Type;
`,
			snapshot: `
import * as Types from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All imports in this declaration are only used as types. Use 'import type'.
type Alias = Types.Type;
`,
		},
		{
			code: `
import { Type, createValue } from "./values";
type Alias = Type & { extra: boolean };
const value = createValue();
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import type { Type} from "./values";
import { createValue } from "./values";
type Alias = Type & { extra: boolean };
const value = createValue();
`,
			snapshot: `
import { Type, createValue } from "./values";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Imports "Type" are only used as types.
type Alias = Type & { extra: boolean };
const value = createValue();
`,
		},
		{
			code: `
import { Type as AliasType, Role as Access } from "./types";
type Alias = AliasType & { access: Access };
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import { type Type as AliasType, type Role as Access } from "./types";
type Alias = AliasType & { access: Access };
`,
			snapshot: `
import { Type as AliasType, Role as Access } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All imports in this declaration are only used as types. Use 'import type'.
type Alias = AliasType & { access: Access };
`,
		},
		{
			code: `
import Type from "./types";
type TypeConstructor = typeof Type;
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import type Type from "./types";
type TypeConstructor = typeof Type;
`,
			snapshot: `
import Type from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~
All imports in this declaration are only used as types. Use 'import type'.
type TypeConstructor = typeof Type;
`,
		},
		{
			code: `
import types from "./types";
type Alias = types.Type;
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import type types from "./types";
type Alias = types.Type;
`,
			snapshot: `
import types from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All imports in this declaration are only used as types. Use 'import type'.
type Alias = types.Type;
`,
		},
		{
			code: `
import { Type } from "./types";
export type { Type };
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import { type Type } from "./types";
export type { Type };
`,
			snapshot: `
import { Type } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All imports in this declaration are only used as types. Use 'import type'.
export type { Type };
`,
		},
		{
			code: `
import Type from "./types";
export = {} as Type;
`,
			fileName: "file.cts",
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import type Type from "./types";
export = {} as Type;
`,
			snapshot: `
import Type from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~
All imports in this declaration are only used as types. Use 'import type'.
export = {} as Type;
`,
		},
		{
			code: `
import { Type } from "./types";
class Value implements Type {
    name = "";
}
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import { type Type } from "./types";
class Value implements Type {
    name = "";
}
`,
			snapshot: `
import { Type } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All imports in this declaration are only used as types. Use 'import type'.
class Value implements Type {
    name = "";
}
`,
		},
		{
			code: `
import * as constants from "./constants";
type Values = {
    [constants.value]: readonly string[];
};
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import type * as constants from "./constants";
type Values = {
    [constants.value]: readonly string[];
};
`,
			snapshot: `
import * as constants from "./constants";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All imports in this declaration are only used as types. Use 'import type'.
type Values = {
    [constants.value]: readonly string[];
};
`,
		},
		{
			code: `
import type { Type } from "./types";
type Alias = Type;
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			options: { prefer: "no-type-imports" },
			output: `
import { Type } from "./types";
type Alias = Type;
`,
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
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			options: { prefer: "no-type-imports" },
			output: `
import { Type, createValue } from "./values";
type Alias = Type;
const value = createValue();
`,
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
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			output: `
import type { Type} from "./values";
import { createValue, type Role } from "./values";
type Alias = Type & { role: Role };
const value = createValue();
`,
			snapshot: `
import { Type, createValue, type Role } from "./values";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Imports "Type" are only used as types.
type Alias = Type & { role: Role };
const value = createValue();
`,
		},
		{
			code: `
import { Type, Role } from "./types";
type Alias = Type & { role: Role };
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			options: { fixStyle: "separate-type-imports" },
			output: `
import type { Type, Role } from "./types";
type Alias = Type & { role: Role };
`,
			snapshot: `
import { Type, Role } from "./types";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All imports in this declaration are only used as types. Use 'import type'.
type Alias = Type & { role: Role };
`,
		},
	],
	valid: [
		{
			code: `
import type { Type } from "./types";
type Alias = Type & { extra: boolean };
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import type Type from "./types";
type Alias = Type & { extra: boolean };
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import type * as Types from "./types";
type Alias = Types.Type & { extra: boolean };
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import { type Type } from "./types";
type Alias = Type & { extra: boolean };
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import { type Type, createValue } from "./values";
type Alias = Type & { extra: boolean };
const value = createValue();
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import { createValue } from "./values";
const value = createValue();
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import { Value } from "./values";
const value = new Value();
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import { format } from "./utils";
format("hello");
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import { Component } from "./component";
export class MyComponent extends Component {}
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `import { Type } from "./types";`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import Type from "./types";
type Box<Type> = Type;
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import Type from "./types";
function wrap() {
    type Type = { name: string };
    let value: Type;
}
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import Value from "./values";
export { Value };
export default Value;
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import type Type from "./types";
export type { Type };
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import * as values from "./values";
const value = values.createValue();
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import type * as constants from "./constants";
export type Values = {
    [constants.value]: readonly string[];
};
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import Value from "./values";
export = Value;
`,
			fileName: "file.cts",
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
		},
		{
			code: `
import { Type } from "./types";
type Alias = Type & { extra: boolean };
`,
			files: {
				"component.ts": `
export class Component {}
`,
				"constants.ts": `
export const value = "value" as const;
`,
				"types.ts": `
class Type {
	name = "";
}

namespace Type {
	export type Type = InstanceType<typeof import("./types").default>;
}

export { Type };
export class Role {
	role = "";
}
export default Type;
`,
				"utils.ts": `
export function format(value: string) {
	return value;
}
`,
				"values.ts": `
export class Type {
	name = "";
}

export class Role {
	role = "";
}

export class Value {}

export function createValue() {
	return new Value();
}

export default Value;
`,
			},
			options: { prefer: "no-type-imports" },
		},
	],
});
