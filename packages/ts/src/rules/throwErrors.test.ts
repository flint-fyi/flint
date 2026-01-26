import rule from "./throwErrors.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
throw "error message";
`,
			snapshot: `
throw "error message";
      ~~~~~~~~~~~~~~~
      Only Error objects should be thrown.
`,
		},
		{
			code: `
throw 42;
`,
			snapshot: `
throw 42;
      ~~
      Only Error objects should be thrown.
`,
		},
		{
			code: `
throw true;
`,
			snapshot: `
throw true;
      ~~~~
      Only Error objects should be thrown.
`,
		},
		{
			code: `
throw undefined;
`,
			snapshot: `
throw undefined;
      ~~~~~~~~~
      Throwing \`undefined\` is not allowed.
`,
		},
		{
			code: `
throw null;
`,
			snapshot: `
throw null;
      ~~~~
      Only Error objects should be thrown.
`,
		},
		{
			code: `
throw { message: "error" };
`,
			snapshot: `
throw { message: "error" };
      ~~~~~~~~~~~~~~~~~~~~
      Only Error objects should be thrown.
`,
		},
		{
			code: `
const msg = "error";
throw msg;
`,
			snapshot: `
const msg = "error";
throw msg;
      ~~~
      Only Error objects should be thrown.
`,
		},
	],
	valid: [
		`throw new Error("message");`,
		`throw new Error();`,
		`throw new TypeError("invalid type");`,
		`throw new RangeError("out of range");`,
		`const error = new Error(); throw error;`,
		`class CustomError extends Error {} throw new CustomError();`,
		`function getError(): Error { return new Error(); } throw getError();`,
		`try { } catch (e) { throw e; }`,
	],
});
