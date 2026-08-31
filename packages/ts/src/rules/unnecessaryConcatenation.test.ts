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
		`
declare const variable: string;
const message = "Hello" + variable;
`,
		`
declare const variable: string;
const message = variable + "World";
`,
		`
declare const firstVariable: string;
declare const secondVariable: string;
const result = firstVariable + secondVariable;
`,
		`
declare const name: string;
const template = \`Hello\${name}World\`;
`,
		`const number = 1 + 2;`,
		`
declare function getName(): string;
const mixed = "Hello" + getName() + "World";
`,
		`
declare function getValue(): string;
const value = "prefix" + getValue();
`,
	],
});
