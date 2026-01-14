import rule from "./errorMessages.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `throw new Error();`,
			snapshot: `throw new Error();
          ~~~~~
          Error constructor should be called with a message argument.`,
		},
		{
			code: `throw new TypeError();`,
			snapshot: `throw new TypeError();
          ~~~~~~~~~
          TypeError constructor should be called with a message argument.`,
		},
		{
			code: `throw new RangeError();`,
			snapshot: `throw new RangeError();
          ~~~~~~~~~~
          RangeError constructor should be called with a message argument.`,
		},
		{
			code: `throw new Error("");`,
			snapshot: `throw new Error("");
          ~~~~~
          Error constructor should be called with a message argument.`,
		},
		{
			code: `throw new Error(undefined);`,
			snapshot: `throw new Error(undefined);
          ~~~~~
          Error constructor should be called with a message argument.`,
		},
		{
			code: `const err = Error();`,
			snapshot: `const err = Error();
            ~~~~~
            Error constructor should be called with a message argument.`,
		},
	],
	valid: [
		`throw new Error("Something went wrong");`,
		`throw new TypeError("Expected a number");`,
		`throw new RangeError(\`Value out of range\`);`,
		`throw new Error(getMessage());`,
		`throw new Error(condition ? "a" : "b");`,
		`class CustomError extends Error {} throw new CustomError();`,
		`const MyError = Error; throw new MyError();`,
	],
});
