import rule from "./enumMemberLiterals.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
enum Foo { a = 1, b = a }
`,
			snapshot: `
enum Foo { a = 1, b = a }
                  ~~~~~
                  Prefer initializing enum members with literal values for predictability.
`,
		},
		{
			code: `
const x = 1; enum Foo { a = x }
`,
			snapshot: `
const x = 1; enum Foo { a = x }
                        ~~~~~
                        Prefer initializing enum members with literal values for predictability.
`,
		},
		{
			code: `
enum Foo { a = 1 + 2 }
`,
			snapshot: `
enum Foo { a = 1 + 2 }
           ~~~~~~~~~
           Prefer initializing enum members with literal values for predictability.
`,
		},
		{
			code: `
enum Foo { a = getValue() }
`,
			snapshot: `
enum Foo { a = getValue() }
           ~~~~~~~~~~~~~~
           Prefer initializing enum members with literal values for predictability.
`,
		},
		{
			code: `
enum Foo { a = \`\${x}\` }
`,
			snapshot: `
enum Foo { a = \`\${x}\` }
           ~~~~~~~~~~
           Prefer initializing enum members with literal values for predictability.
`,
		},
	],
	valid: [
		`enum Foo { a, b, c }`,
		`enum Foo { a = 1, b = 2 }`,
		`enum Foo { a = "hello", b = "world" }`,
		`enum Foo { a = -1, b = +2 }`,
		`enum Foo { a = 0, b = 1, c = 2 }`,
		`const enum Foo { a = 1 }`,
		`enum Foo { a = \`template\` }`,
	],
});
