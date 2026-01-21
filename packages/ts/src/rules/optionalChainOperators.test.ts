import rule from "./optionalChainOperators.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const value = foo && foo.bar;
`,
			snapshot: `
const value = foo && foo.bar;
              ~~~~~~~~~~~~~~
              Prefer optional chaining operator to logically chaining.
`,
		},
	],
	valid: [
		`
const value = foo?.bar;
`,
		`
const value = foo && bar;
`,
	],
});
