import { ruleTester } from "./ruleTester.ts";
import rule from "./typeAssertionStyles.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = <string>foo;
`,
			snapshot: `
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
const value = <Array<string>>items;
`,
			snapshot: `
const value = <Array<string>>items;
              ~~~~~~~~~~~~~~~~~~~~
              Prefer \`as\` syntax for type assertions instead of legacy angle-brackets.
`,
		},
		{
			code: `
function test() {
    return <number>getValue();
}
`,
			snapshot: `
function test() {
    return <number>getValue();
           ~~~~~~~~~~~~~~~~~~
           Prefer \`as\` syntax for type assertions instead of legacy angle-brackets.
}
`,
		},
	],
	valid: [
		`const value = foo as string;`,
		`const value = "hello" as string;`,
		`const value = items as Array<string>;`,
		`const value = { name: "test" } as const;`,
		`const value = <const>{ name: "test" };`,
		`const value = [1, 2, 3] as const;`,
		`const value = <const>[1, 2, 3];`,
		`const value = 1;`,
	],
});
