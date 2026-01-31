import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryUndefinedDefaults.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
let value = undefined;
`,
			output: `
let value;
`,
			snapshot: `
let value = undefined;
            ~~~~~~~~~
            Prefer omitting undefined defaults as they are implicit.
`,
		},
		{
			code: `
const {name = undefined} = object;
`,
			output: `
const {name} = object;
`,
			snapshot: `
const {name = undefined} = object;
              ~~~~~~~~~
              Prefer omitting undefined defaults as they are implicit.
`,
		},
		{
			code: `
function greet(message = undefined) {}
`,
			output: `
function greet(message) {}
`,
			snapshot: `
function greet(message = undefined) {}
                         ~~~~~~~~~
                         Prefer omitting undefined defaults as they are implicit.
`,
		},
		{
			code: `
function example({option = undefined}) {}
`,
			output: `
function example({option}) {}
`,
			snapshot: `
function example({option = undefined}) {}
                           ~~~~~~~~~
                           Prefer omitting undefined defaults as they are implicit.
`,
		},
		{
			code: `
function process() {
    return undefined;
}
`,
			output: `
function process() {
    return;
}
`,
			snapshot: `
function process() {
    return undefined;
           ~~~~~~~~~
           Prefer omitting undefined in return statements.
}
`,
		},
		{
			code: `
function* generate() {
    yield undefined;
}
`,
			output: `
function* generate() {
    yield;
}
`,
			snapshot: `
function* generate() {
    yield undefined;
          ~~~~~~~~~
          Prefer omitting undefined in yield expressions.
}
`,
		},
		{
			code: `
const noop = () => undefined;
`,
			output: `
const noop = () => {};
`,
			snapshot: `
const noop = () => undefined;
                   ~~~~~~~~~
                   Prefer an empty block over returning undefined.
`,
		},
		{
			code: `
const callback = (value: string) => undefined;
`,
			output: `
const callback = (value: string) => {};
`,
			snapshot: `
const callback = (value: string) => undefined;
                                    ~~~~~~~~~
                                    Prefer an empty block over returning undefined.
`,
		},
		{
			code: `
let first = undefined, second = 42;
`,
			output: `
let first, second = 42;
`,
			snapshot: `
let first = undefined, second = 42;
            ~~~~~~~~~
            Prefer omitting undefined defaults as they are implicit.
`,
		},
		{
			code: `
function method(first = undefined, second: number) {}
`,
			output: `
function method(first, second: number) {}
`,
			snapshot: `
function method(first = undefined, second: number) {}
                        ~~~~~~~~~
                        Prefer omitting undefined defaults as they are implicit.
`,
		},
		{
			code: `
const {prop: renamed = undefined} = object;
`,
			output: `
const {prop: renamed} = object;
`,
			snapshot: `
const {prop: renamed = undefined} = object;
                       ~~~~~~~~~
                       Prefer omitting undefined defaults as they are implicit.
`,
		},
	],
	valid: [
		"let value;",
		"const {name} = object;",
		"function greet(message: string) {}",
		"function example({option}: {option?: string}) {}",
		"function process() { return; }",
		"function* generate() { yield; }",
		"const noop = () => {};",
		"let value = null;",
		"function example(param = null) {}",
		"const result = undefined;",
		"const value = someFunction(undefined);",
		"return { value: undefined };",
		"const obj = { key: undefined };",
	],
});
