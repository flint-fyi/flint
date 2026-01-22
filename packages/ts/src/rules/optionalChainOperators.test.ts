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
              Prefer the cleaner \`?.\` optional chaining operator over more verbose logical chains.
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
