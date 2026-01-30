import { ruleTester } from "./ruleTester.ts";
import rule from "./throwErrors.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
throw "error message";
`,
			snapshot: `
throw "error message";
      ~~~~~~~~~~~~~~~
      Only \`Error\` objects should be thrown.
`,
		},
		{
			code: `
throw 42;
`,
			snapshot: `
throw 42;
      ~~
      Only \`Error\` objects should be thrown.
`,
		},
		{
			code: `
throw true;
`,
			snapshot: `
throw true;
      ~~~~
      Only \`Error\` objects should be thrown.
`,
		},
		{
			code: `
throw undefined;
`,
			snapshot: `
throw undefined;
      ~~~~~~~~~
      Only \`Error\` objects should be thrown.
`,
		},
		{
			code: `
throw null;
`,
			snapshot: `
throw null;
      ~~~~
      Only \`Error\` objects should be thrown.
`,
		},
		{
			code: `
throw { message: "error" };
`,
			snapshot: `
throw { message: "error" };
      ~~~~~~~~~~~~~~~~~~~~
      Only \`Error\` objects should be thrown.
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
      Only \`Error\` objects should be thrown.
`,
		},
		{
			code: `
class MyError {
  message: string;
  constructor(msg: string) { this.message = msg; }
}
throw new MyError("oops");
`,
			snapshot: `
class MyError {
  message: string;
  constructor(msg: string) { this.message = msg; }
}
throw new MyError("oops");
      ~~~~~~~~~~~~~~~~~~~
      Only \`Error\` objects should be thrown.
`,
		},
		{
			code: `
class ValidationError {
  errors: string[];
}
throw new ValidationError();
`,
			snapshot: `
class ValidationError {
  errors: string[];
}
throw new ValidationError();
      ~~~~~~~~~~~~~~~~~~~~~
      Only \`Error\` objects should be thrown.
`,
		},
		{
			code: `
throw new Map();
`,
			snapshot: `
throw new Map();
      ~~~~~~~~~
      Only \`Error\` objects should be thrown.
`,
		},
		{
			code: `
throw new Set();
`,
			snapshot: `
throw new Set();
      ~~~~~~~~~
      Only \`Error\` objects should be thrown.
`,
		},
		{
			code: `
throw new Date();
`,
			snapshot: `
throw new Date();
      ~~~~~~~~~~
      Only \`Error\` objects should be thrown.
`,
		},
		{
			code: `
throw new Promise(() => {});
`,
			snapshot: `
throw new Promise(() => {});
      ~~~~~~~~~~~~~~~~~~~~~
      Only \`Error\` objects should be thrown.
`,
		},
		{
			code: `
class NotAnError {}
throw new NotAnError();
`,
			snapshot: `
class NotAnError {}
throw new NotAnError();
      ~~~~~~~~~~~~~~~~
      Only \`Error\` objects should be thrown.
`,
		},
		{
			code: `
class FakeError {}
class MyError extends FakeError {}
throw new MyError();
`,
			snapshot: `
class FakeError {}
class MyError extends FakeError {}
throw new MyError();
      ~~~~~~~~~~~~~
      Only \`Error\` objects should be thrown.
`,
		},
	],
	valid: [
		`throw new Error("message");`,
		`throw new Error();`,
		`throw new TypeError("invalid type");`,
		`throw new RangeError("out of range");`,
		`const error = new Error(); throw error;`,
		`
class CustomError extends Error {}
throw new CustomError();
export {};
`,
		`
class CustomError extends Error {}
class MoreCustomError extends CustomError {}
throw new MoreCustomError();
export {};
`,
		`
class CustomError extends TypeError {}
throw new CustomError();
export {};
`,
		`function getError(): Error { return new Error(); } throw getError();`,
		`try { } catch (e) { throw e; }`,
	],
});
