import rule from "./errorMessages.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
throw new Error();
`,
			snapshot: `
throw new Error();
          ~~~~~
          \`Error\`s created without a message are generally harder to debug.
`,
		},
		{
			code: `
throw new TypeError();
`,
			snapshot: `
throw new TypeError();
          ~~~~~~~~~
          \`TypeError\`s created without a message are generally harder to debug.
`,
		},
		{
			code: `
throw new RangeError();
`,
			snapshot: `
throw new RangeError();
          ~~~~~~~~~~
          \`RangeError\`s created without a message are generally harder to debug.
`,
		},
		{
			code: `
throw new Error("");
`,
			snapshot: `
throw new Error("");
          ~~~~~
          \`Error\`s created without a message are generally harder to debug.
`,
		},
		{
			code: `
throw new Error(undefined);
`,
			snapshot: `
throw new Error(undefined);
          ~~~~~
          \`Error\`s created without a message are generally harder to debug.
`,
		},
		{
			code: `
Error();
`,
			snapshot: `
Error();
~~~~~
\`Error\`s created without a message are generally harder to debug.
`,
		},
		{
			code: `
const error = Error();
`,
			snapshot: `
const error = Error();
              ~~~~~
              \`Error\`s created without a message are generally harder to debug.
`,
		},
		{
			code: `
const MyError = Error; throw new MyError();
`,
			snapshot: `
const MyError = Error; throw new MyError();
                                 ~~~~~~~
                                 \`Error\`s created without a message are generally harder to debug.
`,
		},
	],
	valid: [
		`throw new Error("Something went wrong");`,
		`throw new TypeError("Expected a number");`,
		`throw new RangeError(\`Value out of range\`);`,
		`throw new Error(getMessage());`,
		`throw new Error(condition ? "a" : "b");`,
		`const MyError = Error; throw new MyError(condition ? "a" : "b");`,
		`class CustomError extends Error {} throw new CustomError();`,
		`
class Error {
  constructor(message: string) {}
}

throw new Error();

export {}
		`,
		`
class Error {
  constructor(message: string) {}
}

throw new Error("Something went wrong");

export {}
		`,
	],
});
