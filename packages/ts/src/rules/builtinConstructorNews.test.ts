import rule from "./builtinConstructorNews.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const list = Array(10);
`,
			snapshot: `
const list = Array(10);
             ~~~~~
             Use new Array() to create instances.
`,
		},
		{
			code: `
const now = Date();
`,
			snapshot: `
const now = Date();
            ~~~~
            Use new Date() to create instances.
`,
		},
		{
			code: `
const map = Map([["key", "value"]]);
`,
			snapshot: `
const map = Map([["key", "value"]]);
            ~~~
            Use new Map() to create instances.
`,
		},
		{
			code: `
const set = Set([1, 2, 3]);
`,
			snapshot: `
const set = Set([1, 2, 3]);
            ~~~
            Use new Set() to create instances.
`,
		},
		{
			code: `
const promise = Promise((resolve) => resolve());
`,
			snapshot: `
const promise = Promise((resolve) => resolve());
                ~~~~~~~
                Use new Promise() to create instances.
`,
		},
		{
			code: `
const regex = RegExp("pattern");
`,
			snapshot: `
const regex = RegExp("pattern");
              ~~~~~~
              Use new RegExp() to create instances.
`,
		},
		{
			code: `
const obj = Object();
`,
			snapshot: `
const obj = Object();
            ~~~~~~
            Use new Object() to create instances.
`,
		},
		{
			code: `
const buffer = ArrayBuffer(16);
`,
			snapshot: `
const buffer = ArrayBuffer(16);
               ~~~~~~~~~~~
               Use new ArrayBuffer() to create instances.
`,
		},
		{
			code: `
const str = new String("hello");
`,
			snapshot: `
const str = new String("hello");
            ~~~~~~~~~~
            Use String() without new to coerce values to primitives.
`,
		},
		{
			code: `
const num = new Number(42);
`,
			snapshot: `
const num = new Number(42);
            ~~~~~~~~~~
            Use Number() without new to coerce values to primitives.
`,
		},
		{
			code: `
const bool = new Boolean(true);
`,
			snapshot: `
const bool = new Boolean(true);
             ~~~~~~~~~~~
             Use Boolean() without new to coerce values to primitives.
`,
		},
		{
			code: `
const sym = new Symbol("description");
`,
			snapshot: `
const sym = new Symbol("description");
            ~~~~~~~~~~
            Use Symbol() without new to coerce values to primitives.
`,
		},
		{
			code: `
const big = new BigInt(123);
`,
			snapshot: `
const big = new BigInt(123);
            ~~~~~~~~~~
            Use BigInt() without new to coerce values to primitives.
`,
		},
	],
	valid: [
		"const list = new Array(10);",
		"const now = new Date();",
		"const map = new Map();",
		"const set = new Set();",
		"const promise = new Promise((resolve) => resolve());",
		"const regex = new RegExp('pattern');",
		"const obj = new Object();",
		"const buffer = new ArrayBuffer(16);",
		"const str = String(value);",
		"const num = Number(value);",
		"const bool = Boolean(value);",
		"const sym = Symbol('description');",
		"const big = BigInt(123);",
		"const CustomArray = () => []; CustomArray();",
		"class MyDate {} new MyDate();",
	],
});
