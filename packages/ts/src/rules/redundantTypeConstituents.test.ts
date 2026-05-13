import rule from "./redundantTypeConstituents.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
type T = number | any;
`,
			snapshot: `
type T = number | any;
                  ~~~
                  any overrides all other types in this union type.
`,
		},
		{
			code: `
type T = any | number;
`,
			snapshot: `
type T = any | number;
         ~~~
         any overrides all other types in this union type.
`,
		},
		{
			code: `
type T = number | never;
`,
			snapshot: `
type T = number | never;
                  ~~~~~
                  never is overridden by other types in this union type.
`,
		},
		{
			code: `
type T = never | number;
`,
			snapshot: `
type T = never | number;
         ~~~~~
         never is overridden by other types in this union type.
`,
		},
		{
			code: `
type T = number | unknown;
`,
			snapshot: `
type T = number | unknown;
                  ~~~~~~~
                  unknown overrides all other types in this union type.
`,
		},
		{
			code: `
type T = unknown | number;
`,
			snapshot: `
type T = unknown | number;
         ~~~~~~~
         unknown overrides all other types in this union type.
`,
		},
		{
			code: `
type T = number | 0;
`,
			snapshot: `
type T = number | 0;
                  ~
                  0 is overridden by number in this union type.
`,
		},
		{
			code: `
type T = "" | string;
`,
			snapshot: `
type T = "" | string;
         ~~
         "" is overridden by string in this union type.
`,
		},
		{
			code: `
type T = 0n | bigint;
`,
			snapshot: `
type T = 0n | bigint;
         ~~
         0n is overridden by bigint in this union type.
`,
		},
		{
			code: `
type T = false | boolean;
`,
			snapshot: `
type T = false | boolean;
         ~~~~~
         false is overridden by boolean in this union type.
`,
		},
		{
			code: `
type T = true | boolean;
`,
			snapshot: `
type T = true | boolean;
         ~~~~
         true is overridden by boolean in this union type.
`,
		},
		{
			code: `
type T = number & any;
`,
			snapshot: `
type T = number & any;
                  ~~~
                  any overrides all other types in this intersection type.
`,
		},
		{
			code: `
type T = any & number;
`,
			snapshot: `
type T = any & number;
         ~~~
         any overrides all other types in this intersection type.
`,
		},
		{
			code: `
type T = number & never;
`,
			snapshot: `
type T = number & never;
                  ~~~~~
                  never overrides all other types in this intersection type.
`,
		},
		{
			code: `
type T = never & number;
`,
			snapshot: `
type T = never & number;
         ~~~~~
         never overrides all other types in this intersection type.
`,
		},
		{
			code: `
type T = number & unknown;
`,
			snapshot: `
type T = number & unknown;
                  ~~~~~~~
                  unknown is overridden by other types in this intersection type.
`,
		},
		{
			code: `
type T = unknown & number;
`,
			snapshot: `
type T = unknown & number;
         ~~~~~~~
         unknown is overridden by other types in this intersection type.
`,
		},
		{
			code: `
type T = number & 0;
`,
			snapshot: `
type T = number & 0;
         ~~~~~~
         number is overridden by 0 in this intersection type.
`,
		},
		{
			code: `
type T = "" & string;
`,
			snapshot: `
type T = "" & string;
              ~~~~~~
              string is overridden by "" in this intersection type.
`,
		},
		{
			code: `
type T = 0n & bigint;
`,
			snapshot: `
type T = 0n & bigint;
              ~~~~~~
              bigint is overridden by 0n in this intersection type.
`,
		},
		{
			code: `
type ErrorTypes = NotKnown | 0;
`,
			snapshot: `
type ErrorTypes = NotKnown | 0;
                  ~~~~~~~~
                  NotKnown is an 'error' type that acts as 'any' and overrides all other types in this union type.
`,
		},
		{
			code: `
type ErrorTypes = NotKnown & 0;
`,
			snapshot: `
type ErrorTypes = NotKnown & 0;
                  ~~~~~~~~
                  NotKnown is an 'error' type that acts as 'any' and overrides all other types in this intersection type.
`,
		},
		{
			code: `
type B = "b";
type T = B | string;
`,
			snapshot: `
type B = "b";
type T = B | string;
         ~
         "b" is overridden by string in this union type.
`,
		},
		{
			code: `
type B = 0 | 1;
type T = (2 | B) | number;
`,
			snapshot: `
type B = 0 | 1;
type T = (2 | B) | number;
         ~~~~~~~
         0 | 1 | 2 is overridden by number in this union type.
`,
		},
	],
	valid: [
		`type T = any;`,
		`type T = never;`,
		`type T = 1 | 2;`,
		`type T = () => never;`,
		`type T = () => never | string;`,
		`type T = () => string | never;`,
		`type T = { (): string | never };`,
		`function example(): string | never { return ""; }`,
		`const example = (): string | never => { return ""; };`,
		`type T = { new (): string | never };`,
		`type T = bigint;`,
		`type T = 1n | 2n;`,
		`type T = boolean;`,
		`type T = false | true;`,
		`type T = number;`,
		`type T = 1 | false;`,
		`type T = string;`,
		`type T = "a" | "b";`,
		`type T = bigint | null;`,
		`type T = boolean | null;`,
		`type T = number | null;`,
		`type T = string | null;`,
		`type T = bigint & null;`,
		`type T = boolean & null;`,
		`type T = number & null;`,
		`type T = string & null;`,
		`declare function example(): never | "value";`,
	],
});
