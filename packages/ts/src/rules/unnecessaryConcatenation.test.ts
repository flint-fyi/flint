import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryConcatenation.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const message = "Hello" + "World";
`,
			snapshot: `
const message = "Hello" + "World";
                        ~
                        This string concatenation can be streamlined into a single string literal.
`,
		},
		{
			code: `
const path = 'foo' + 'bar';
`,
			snapshot: `
const path = 'foo' + 'bar';
                   ~
                   This string concatenation can be streamlined into a single string literal.
`,
		},
		{
			code: `
const result = "abc" + "def" + "ghi";
`,
			snapshot: `
const result = "abc" + "def" + "ghi";
                     ~
                     This string concatenation can be streamlined into a single string literal.
`,
		},
		{
			code: `
const text = "first" + "second";
`,
			snapshot: `
const text = "first" + "second";
                     ~
                     This string concatenation can be streamlined into a single string literal.
`,
		},
		{
			code: `
const mixed = 'single' + "double";
`,
			snapshot: `
const mixed = 'single' + "double";
                       ~
                       This string concatenation can be streamlined into a single string literal.
`,
		},
		{
			code: `
const withSpace = "Hello " + "World";
`,
			snapshot: `
const withSpace = "Hello " + "World";
                           ~
                           This string concatenation can be streamlined into a single string literal.
`,
		},
		{
			code: `
const longString = "This is a very long string that " +
    "continues on the next line";
`,
			snapshot: `
const longString = "This is a very long string that " +
                                                      ~
                                                      This string concatenation can be streamlined into a single string literal.
    "continues on the next line";
`,
		},
	],
	valid: [
		`const message = "Hello" + variable;`,
		`const message = variable + "World";`,
		`const result = variable1 + variable2;`,
		`const template = \`Hello\${name}World\`;`,
		`const number = 1 + 2;`,
		`const mixed = "Hello" + getName() + "World";`,
		`const value = "prefix" + getValue();`,
	],
});
