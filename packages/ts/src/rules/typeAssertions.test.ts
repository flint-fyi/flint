import rule from "./typeAssertions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `const value = <string>foo;`,
			snapshot: `const value = <string>foo;
              ~~~~~~~~~~~
              Use 'as' syntax for type assertions instead of angle-brackets.`,
		},
		{
			code: `const value = <string>"hello";`,
			snapshot: `const value = <string>"hello";
              ~~~~~~~~~~~~~~~
              Use 'as' syntax for type assertions instead of angle-brackets.`,
		},
		{
			code: `const value = <Array<string>>items;`,
			snapshot: `const value = <Array<string>>items;
              ~~~~~~~~~~~~~~~~~~~~
              Use 'as' syntax for type assertions instead of angle-brackets.`,
		},
		{
			code: `function test() {
    return <number>getValue();
}`,
			snapshot: `function test() {
    return <number>getValue();
           ~~~~~~~~~~~~~~~~~~
           Use 'as' syntax for type assertions instead of angle-brackets.
}`,
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
