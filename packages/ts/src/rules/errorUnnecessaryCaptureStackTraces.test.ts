import rule from "./errorUnnecessaryCaptureStackTraces.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class MyError extends Error {
	constructor() {
		Error.captureStackTrace(this, MyError);
	}
}
`,
			snapshot: `
class MyError extends Error {
	constructor() {
		Error.captureStackTrace(this, MyError);
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Calling \`Error.captureStackTrace()\` is unnecessary in built-in Error subclass constructors.
	}
}
`,
		},
		{
			code: `
class MyError extends Error {
	constructor() {
		Error.captureStackTrace?.(this, MyError);
	}
}
`,
			snapshot: `
class MyError extends Error {
	constructor() {
		Error.captureStackTrace?.(this, MyError);
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Calling \`Error.captureStackTrace()\` is unnecessary in built-in Error subclass constructors.
	}
}
`,
		},
		{
			code: `
class MyError extends Error {
	constructor() {
		Error.captureStackTrace(this, this.constructor);
	}
}
`,
			snapshot: `
class MyError extends Error {
	constructor() {
		Error.captureStackTrace(this, this.constructor);
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Calling \`Error.captureStackTrace()\` is unnecessary in built-in Error subclass constructors.
	}
}
`,
		},
		{
			code: `
class MyError extends Error {
	constructor() {
		Error.captureStackTrace?.(this, this.constructor);
	}
}
`,
			snapshot: `
class MyError extends Error {
	constructor() {
		Error.captureStackTrace?.(this, this.constructor);
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Calling \`Error.captureStackTrace()\` is unnecessary in built-in Error subclass constructors.
	}
}
`,
		},
		{
			code: `
class MyError extends Error {
	constructor() {
		Error.captureStackTrace(this, new.target);
	}
}
`,
			snapshot: `
class MyError extends Error {
	constructor() {
		Error.captureStackTrace(this, new.target);
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Calling \`Error.captureStackTrace()\` is unnecessary in built-in Error subclass constructors.
	}
}
`,
		},
		{
			code: `
class MyError extends Error {
	constructor() {
		Error.captureStackTrace?.(this, new.target);
	}
}
`,
			snapshot: `
class MyError extends Error {
	constructor() {
		Error.captureStackTrace?.(this, new.target);
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Calling \`Error.captureStackTrace()\` is unnecessary in built-in Error subclass constructors.
	}
}
`,
		},
		{
			code: `
class MyError extends TypeError {
	constructor() {
		Error.captureStackTrace(this, MyError);
	}
}
`,
			snapshot: `
class MyError extends TypeError {
	constructor() {
		Error.captureStackTrace(this, MyError);
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Calling \`Error.captureStackTrace()\` is unnecessary in built-in Error subclass constructors.
	}
}
`,
		},
	],
	valid: [
		`class MyError extends Error {
	constructor() {
		super();
		this.name = 'MyError';
	}
}`,
		`class MyError extends CustomError {
	constructor() {
		Error.captureStackTrace(this, MyError);
	}
}`,
		`class MyClass {
	constructor() {
		Error.captureStackTrace(this, MyClass);
	}
}`,
		`class MyError extends Error {
	constructor() {
		Error.captureStackTrace(this, OtherClass);
	}
}`,
	],
});
