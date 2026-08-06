import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryTypeArguments.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
type Result = Container<string>;
type Container<Value = string> = { value: Value };
`,
			output: `
type Result = Container;
type Container<Value = string> = { value: Value };
`,
			snapshot: `
type Result = Container<string>;
                        ~~~~~~
                        This type argument repeats its type parameter's default.
type Container<Value = string> = { value: Value };
`,
		},
		{
			code: `
declare function select<Value = string>(): Value;
select<string>();
`,
			snapshot: `
declare function select<Value = string>(): Value;
select<string>();
       ~~~~~~
       This type argument repeats its type parameter's default.
`,
			suggestions: [
				{
					id: "removeTypeArgument",
					updated: `
declare function select<Value = string>(): Value;
select();
`,
				},
			],
		},
		{
			code: `
interface Parent<Value = string> {}
interface Child extends Parent<string> {}
`,
			output: `
interface Parent<Value = string> {}
interface Child extends Parent {}
`,
			snapshot: `
interface Parent<Value = string> {}
interface Child extends Parent<string> {}
                               ~~~~~~
                               This type argument repeats its type parameter's default.
`,
		},
		{
			code: `
type Pair<First, Second = string> = [First, Second];
type Result = Pair<number, /* retained */ string>;
`,
			snapshot: `
type Pair<First, Second = string> = [First, Second];
type Result = Pair<number, /* retained */ string>;
                                          ~~~~~~
                                          This type argument repeats its type parameter's default.
`,
		},
		{
			code: `
type Pair<First, Second = string> = [First, Second];
type Result = Pair<number, string>;
`,
			output: `
type Pair<First, Second = string> = [First, Second];
type Result = Pair<number>;
`,
			snapshot: `
type Pair<First, Second = string> = [First, Second];
type Result = Pair<number, string>;
                           ~~~~~~
                           This type argument repeats its type parameter's default.
`,
		},
		{
			code: `
type Default = Map<string, string>;
type Container<Value = Default> = Value;
type Result = Container<Map<string, string>>;
`,
			output: `
type Default = Map<string, string>;
type Container<Value = Default> = Value;
type Result = Container;
`,
			snapshot: `
type Default = Map<string, string>;
type Container<Value = Default> = Value;
type Result = Container<Map<string, string>>;
                        ~~~~~~~~~~~~~~~~~~~
                        This type argument repeats its type parameter's default.
`,
		},
		{
			code: `
class Parent<Value = string> {}
class Child extends Parent<string> {}
`,
			output: `
class Parent<Value = string> {}
class Child extends Parent {}
`,
			snapshot: `
class Parent<Value = string> {}
class Child extends Parent<string> {}
                           ~~~~~~
                           This type argument repeats its type parameter's default.
`,
		},
		{
			code: `
interface Contract<Value = string> {}
class Implementation implements Contract<string> {}
`,
			output: `
interface Contract<Value = string> {}
class Implementation implements Contract {}
`,
			snapshot: `
interface Contract<Value = string> {}
class Implementation implements Contract<string> {}
                                         ~~~~~~
                                         This type argument repeats its type parameter's default.
`,
		},
		{
			code: `
class Container<Value = string> {}
new Container<string>();
`,
			snapshot: `
class Container<Value = string> {}
new Container<string>();
              ~~~~~~
              This type argument repeats its type parameter's default.
`,
			suggestions: [
				{
					id: "removeTypeArgument",
					updated: `
class Container<Value = string> {}
new Container();
`,
				},
			],
		},
		{
			code: `
class Container<First, Second = string> {
    constructor(value: Second) {}
}
new Container<number, string>("value");
`,
			snapshot: `
class Container<First, Second = string> {
    constructor(value: Second) {}
}
new Container<number, string>("value");
                      ~~~~~~
                      This type argument repeats its type parameter's default.
`,
			suggestions: [
				{
					id: "removeTypeArgument",
					updated: `
class Container<First, Second = string> {
    constructor(value: Second) {}
}
new Container<number>("value");
`,
				},
			],
		},
		{
			code: `
declare function tag<Value = string>(strings: TemplateStringsArray): Value;
tag<string>\`value\`;
`,
			snapshot: `
declare function tag<Value = string>(strings: TemplateStringsArray): Value;
tag<string>\`value\`;
    ~~~~~~
    This type argument repeats its type parameter's default.
`,
			suggestions: [
				{
					id: "removeTypeArgument",
					updated: `
declare function tag<Value = string>(strings: TemplateStringsArray): Value;
tag\`value\`;
`,
				},
			],
		},
		{
			code: `
declare function Component<Value = string>(properties: { value: Value }): any;
const element = <Component<string> value="text" />;
`,
			fileName: "file.tsx",
			snapshot: `
declare function Component<Value = string>(properties: { value: Value }): any;
const element = <Component<string> value="text" />;
                           ~~~~~~
                           This type argument repeats its type parameter's default.
`,
			suggestions: [
				{
					id: "removeTypeArgument",
					updated: `
declare function Component<Value = string>(properties: { value: Value }): any;
const element = <Component value="text" />;
`,
				},
			],
		},
		{
			code: `
declare function Component<Value = Promise<string>>(properties: { children?: unknown }): any;
const element = <Component<Promise<string>>>text</Component>;
`,
			fileName: "file.tsx",
			snapshot: `
declare function Component<Value = Promise<string>>(properties: { children?: unknown }): any;
const element = <Component<Promise<string>>>text</Component>;
                           ~~~~~~~~~~~~~~~
                           This type argument repeats its type parameter's default.
`,
			suggestions: [
				{
					id: "removeTypeArgument",
					updated: `
declare function Component<Value = Promise<string>>(properties: { children?: unknown }): any;
const element = <Component>text</Component>;
`,
				},
			],
		},
		{
			code: `
import type { Container } from "./container";
type Result = Container<string>;
`,
			files: {
				"container.ts": `export type Container<Value = string> = Value;`,
			},
			output: `
import type { Container } from "./container";
type Result = Container;
`,
			snapshot: `
import type { Container } from "./container";
type Result = Container<string>;
                        ~~~~~~
                        This type argument repeats its type parameter's default.
`,
		},
		{
			code: `
declare const Container: new <Value = string>() => { value: Value };
new Container<string>();
`,
			snapshot: `
declare const Container: new <Value = string>() => { value: Value };
new Container<string>();
              ~~~~~~
              This type argument repeats its type parameter's default.
`,
			suggestions: [
				{
					id: "removeTypeArgument",
					updated: `
declare const Container: new <Value = string>() => { value: Value };
new Container();
`,
				},
			],
		},
	],
	valid: [
		`type Container<Value = string> = { value: Value }; type Result = Container<number>;`,
		`type Container<Value> = { value: Value }; type Result = Container<string>;`,
		`declare function select<Required>(): Required; select<string>();`,
		`function make<Value = string>() { return make<string>; }`,
		`class Box<Value = string> { constructor(value: Value) {} } new Box<string>("value");`,
		`type Wrapped<Value = Promise<string>> = Value; type Result = Wrapped<Promise<number>>;`,
		`class Base<Value> {} interface Base<Value = string> {} class Child extends Base<string> {}`,
		`interface Base<Value = string> {} class Base<Value> {} class Child implements Base<number> {}`,
		`type Parent = { name: string }; type Child = Parent & { age: number }; type Container<Value = Parent> = Value; type Result = Container<Child>;`,
		`type Container<Value = { name: string }> = Value; type Result = Container<{ name: string }>;`,
		`type Container<Value = Map<string, string>> = Value; type Result = Container<Map<string, number>>;`,
		`type Container<Value = Map<string, string>> = Value; type Result = Container<Promise<string>>;`,
		`type Container<Value = string> = Value; type Result = Container<string, string>;`,
		`type Result = Missing<string>;`,
		`declare function getConstructor(): any; new (getConstructor())<string>();`,
		`namespace Container {} type Result = Container<string>;`,
		`enum Container {} type Result = Container<string>;`,
		`declare function select<Value>(value: Value): Value; select<number>(1);`,
		`declare function overloaded<Value>(): Value; declare function overloaded<Value = string>(value: Value): Value; overloaded<string>();`,
		`declare const unknownValue: any; unknownValue<string>();`,
		`declare function takesCallback(callback: () => void): void; function generic<Value = string>(): void {} takesCallback(generic<string>);`,
	],
});
