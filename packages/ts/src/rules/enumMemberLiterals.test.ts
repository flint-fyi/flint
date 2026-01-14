import rule from "./enumMemberLiterals.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `enum Foo { a = 1, b = a }`,
			snapshot: `enum Foo { a = 1, b = a }
                  ~~~~~
                  Enum members should be initialized with literal values.`,
		},
		{
			code: `const x = 1; enum Foo { a = x }`,
			snapshot: `const x = 1; enum Foo { a = x }
                        ~~~~~
                        Enum members should be initialized with literal values.`,
		},
		{
			code: `enum Foo { a = 1 + 2 }`,
			snapshot: `enum Foo { a = 1 + 2 }
           ~~~~~~~~~
           Enum members should be initialized with literal values.`,
		},
		{
			code: `enum Foo { a = getValue() }`,
			snapshot: `enum Foo { a = getValue() }
           ~~~~~~~~~~~~~~
           Enum members should be initialized with literal values.`,
		},
		{
			code: `enum Foo { a = \`\${x}\` }`,
			snapshot: `enum Foo { a = \`\${x}\` }
           ~~~~~~~~~~
           Enum members should be initialized with literal values.`,
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
