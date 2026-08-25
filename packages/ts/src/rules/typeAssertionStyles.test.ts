import { ruleTester } from "./ruleTester.ts";
import rule from "./typeAssertionStyles.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const foo: unknown;

const value = <string>foo;
`,
			snapshot: `
declare const foo: unknown;

const value = <string>foo;
              ~~~~~~~~~~~
              Prefer \`as\` syntax for type assertions instead of legacy angle-brackets.
`,
		},
		{
			code: `
const value = <string>"hello";
`,
			snapshot: `
const value = <string>"hello";
              ~~~~~~~~~~~~~~~
              Prefer \`as\` syntax for type assertions instead of legacy angle-brackets.
`,
		},
		{
			code: `
declare const items: unknown;

const value = <Array<string>>items;
`,
			snapshot: `
declare const items: unknown;

const value = <Array<string>>items;
              ~~~~~~~~~~~~~~~~~~~~
              Prefer \`as\` syntax for type assertions instead of legacy angle-brackets.
`,
		},
		{
			code: `
declare function getValue(): unknown;

function test() {
    return <number>getValue();
}
`,
			snapshot: `
declare function getValue(): unknown;

function test() {
    return <number>getValue();
           ~~~~~~~~~~~~~~~~~~
           Prefer \`as\` syntax for type assertions instead of legacy angle-brackets.
}
`,
		},
	],
	valid: [
		`
declare const foo: unknown;
const value = foo as string;
`,
		`const value = "hello" as string;`,
		`
declare const items: unknown;
const value = items as Array<string>;
`,
		`const value = { name: "test" } as const;`,
		`const value = <const>{ name: "test" };`,
		`const value = [1, 2, 3] as const;`,
		`const value = <const>[1, 2, 3];`,
		`const value = 1;`,
	],
});
