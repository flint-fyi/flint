import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryTypeConstraints.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function identity<Value extends any>(value: Value) { return value; }
`,
			output: `
function identity<Value>(value: Value) { return value; }
`,
			snapshot: `
function identity<Value extends any>(value: Value) { return value; }
                  ~~~~~~~~~~~~~~~~~
                  Type parameter \`Value\` has an unnecessary \`any\` constraint.
`,
		},
		{
			code: `
function transform<Value extends any, Result extends Value>(value: Value): Result { return value as Result; }
`,
			output: `
function transform<Value, Result extends Value>(value: Value): Result { return value as Result; }
`,
			snapshot: `
function transform<Value extends any, Result extends Value>(value: Value): Result { return value as Result; }
                   ~~~~~~~~~~~~~~~~~
                   Type parameter \`Value\` has an unnecessary \`any\` constraint.
`,
		},
		{
			code: `
type Pair<First extends string, Second extends unknown> = [First, Second];
`,
			output: `
type Pair<First extends string, Second> = [First, Second];
`,
			snapshot: `
type Pair<First extends string, Second extends unknown> = [First, Second];
                                ~~~~~~~~~~~~~~~~~~~~~~
                                Type parameter \`Second\` has an unnecessary \`unknown\` constraint.
`,
		},
		{
			code: `
type Mapping<Key extends any, Value extends unknown = Key> = Record<string, Value>;
`,
			output: `
type Mapping<Key, Value = Key> = Record<string, Value>;
`,
			snapshot: `
type Mapping<Key extends any, Value extends unknown = Key> = Record<string, Value>;
             ~~~~~~~~~~~~~~~
             Type parameter \`Key\` has an unnecessary \`any\` constraint.
                              ~~~~~~~~~~~~~~~~~~~~~~~~~~~
                              Type parameter \`Value\` has an unnecessary \`unknown\` constraint.
`,
		},
		{
			code: `
const transform = <Value extends any>(value: Value) => value;
`,
			output: `
const transform = <Value>(value: Value) => value;
`,
			snapshot: `
const transform = <Value extends any>(value: Value) => value;
                   ~~~~~~~~~~~~~~~~~
                   Type parameter \`Value\` has an unnecessary \`any\` constraint.
`,
		},
		{
			code: `
const transform = <Value extends any>(value: Value) => value;
`,
			fileName: "component.tsx",
			output: `
const transform = <Value,>(value: Value) => value;
`,
			snapshot: `
const transform = <Value extends any>(value: Value) => value;
                   ~~~~~~~~~~~~~~~~~
                   Type parameter \`Value\` has an unnecessary \`any\` constraint.
`,
		},
		{
			code: `
const transform = <Value extends unknown>(value: Value) => value;
`,
			fileName: "module.mts",
			output: `
const transform = <Value,>(value: Value) => value;
`,
			snapshot: `
const transform = <Value extends unknown>(value: Value) => value;
                   ~~~~~~~~~~~~~~~~~~~~~
                   Type parameter \`Value\` has an unnecessary \`unknown\` constraint.
`,
		},
		{
			code: `
const transform = <Value extends unknown>(value: Value) => value;
`,
			fileName: "module.cts",
			output: `
const transform = <Value,>(value: Value) => value;
`,
			snapshot: `
const transform = <Value extends unknown>(value: Value) => value;
                   ~~~~~~~~~~~~~~~~~~~~~
                   Type parameter \`Value\` has an unnecessary \`unknown\` constraint.
`,
		},
		{
			code: `
const preserve = <Value extends any = string>(value: Value) => value;
`,
			fileName: "component.tsx",
			output: `
const preserve = <Value = string>(value: Value) => value;
`,
			snapshot: `
const preserve = <Value extends any = string>(value: Value) => value;
                  ~~~~~~~~~~~~~~~~~~~~~~~~~~
                  Type parameter \`Value\` has an unnecessary \`any\` constraint.
`,
		},
		{
			code: `
const preserve = <Value extends any,>(value: Value) => value;
`,
			fileName: "component.tsx",
			output: `
const preserve = <Value,>(value: Value) => value;
`,
			snapshot: `
const preserve = <Value extends any,>(value: Value) => value;
                  ~~~~~~~~~~~~~~~~~
                  Type parameter \`Value\` has an unnecessary \`any\` constraint.
`,
		},
		{
			code: `
const preserve = <Value /* note */ extends unknown /* end */, Other>(value: Value, other: Other) => [value, other];
`,
			fileName: "component.tsx",
			output: `
const preserve = <Value /* end */, Other>(value: Value, other: Other) => [value, other];
`,
			snapshot: `
const preserve = <Value /* note */ extends unknown /* end */, Other>(value: Value, other: Other) => [value, other];
                  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                  Type parameter \`Value\` has an unnecessary \`unknown\` constraint.
`,
		},
		{
			code: `
class Store<Value extends any> {}
`,
			output: `
class Store<Value> {}
`,
			snapshot: `
class Store<Value extends any> {}
            ~~~~~~~~~~~~~~~~~
            Type parameter \`Value\` has an unnecessary \`any\` constraint.
`,
		},
		{
			code: `
const Store = class<Value extends unknown> {};
`,
			output: `
const Store = class<Value> {};
`,
			snapshot: `
const Store = class<Value extends unknown> {};
                    ~~~~~~~~~~~~~~~~~~~~~
                    Type parameter \`Value\` has an unnecessary \`unknown\` constraint.
`,
		},
		{
			code: `
class Store { method<Value extends any>() {} }
`,
			output: `
class Store { method<Value>() {} }
`,
			snapshot: `
class Store { method<Value extends any>() {} }
                     ~~~~~~~~~~~~~~~~~
                     Type parameter \`Value\` has an unnecessary \`any\` constraint.
`,
		},
		{
			code: `
const Store = class { method<Value extends unknown>() {} };
`,
			output: `
const Store = class { method<Value>() {} };
`,
			snapshot: `
const Store = class { method<Value extends unknown>() {} };
                             ~~~~~~~~~~~~~~~~~~~~~
                             Type parameter \`Value\` has an unnecessary \`unknown\` constraint.
`,
		},
		{
			code: `
interface Store<Value extends unknown> {}
`,
			output: `
interface Store<Value> {}
`,
			snapshot: `
interface Store<Value extends unknown> {}
                ~~~~~~~~~~~~~~~~~~~~~
                Type parameter \`Value\` has an unnecessary \`unknown\` constraint.
`,
		},
		{
			code: `
type Store<Value extends any> = Value;
`,
			output: `
type Store<Value> = Value;
`,
			snapshot: `
type Store<Value extends any> = Value;
           ~~~~~~~~~~~~~~~~~
           Type parameter \`Value\` has an unnecessary \`any\` constraint.
`,
		},
		{
			code: `
function* iterate<Value extends unknown>() {}
`,
			output: `
function* iterate<Value>() {}
`,
			snapshot: `
function* iterate<Value extends unknown>() {}
                  ~~~~~~~~~~~~~~~~~~~~~
                  Type parameter \`Value\` has an unnecessary \`unknown\` constraint.
`,
		},
	],
	valid: [
		"const value = 1;",
		"function identity<Value>(value: Value) { return value; }",
		"function identity<Value extends string>(value: Value) { return value; }",
		"function identity<Value extends string | number>(value: Value) { return value; }",
		"function identity<Value extends string | any>(value: Value) { return value; }",
		"type AnyAlias = any; function identity<Value extends AnyAlias>(value: Value) { return value; }",
		"function identity<Value extends (any)>(value: Value) { return value; }",
		"function identity<Value extends keyof any>(value: Value) { return value; }",
		"const identity = <Value,>(value: Value) => value;",
		"const identity = <Value extends string>(value: Value) => value;",
	],
});
