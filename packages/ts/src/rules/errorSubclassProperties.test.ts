import rule from "./errorSubclassProperties.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class foo extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'foo';
	}
}
`,
			snapshot: `
class foo extends Error {
      ~~~
      Error subclass name 'foo' should start with an uppercase letter and end with 'Error'.
	constructor(message: string) {
		super(message);
		this.name = 'foo';
	}
}
`,
		},
		{
			code: `
class Custom extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'Custom';
	}
}
`,
			snapshot: `
class Custom extends Error {
      ~~~~~~
      Error subclass name 'Custom' should start with an uppercase letter and end with 'Error'.
	constructor(message: string) {
		super(message);
		this.name = 'Custom';
	}
}
`,
		},
		{
			code: `
class CustomError extends Error {
	constructor(message: string) {
		super(message);
		this.message = message;
		this.name = 'CustomError';
	}
}
`,
			snapshot: `
class CustomError extends Error {
	constructor(message: string) {
		super(message);
		this.message = message;
		~~~~~~~~~~~~~~~~~~~~~~
		Assignment to \`this.message\` is redundant when the message is already passed to \`super()\`.
		this.name = 'CustomError';
	}
}
`,
		},
		{
			code: `
class CustomError extends Error {
	constructor(message: string) {
		super(message);
	}
}
`,
			snapshot: `
class CustomError extends Error {
	constructor(message: string) {
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	Error subclass is missing a \`this.name\` assignment in the constructor.
		super(message);
		~~~~~~~~~~~~~~~
	}
	~
}
`,
		},
		{
			code: `
class CustomError extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}
`,
			snapshot: `
class CustomError extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		Avoid using \`this.constructor.name\` for the error name.
	}
}
`,
		},
		{
			code: `
class CustomError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'WrongError';
	}
}
`,
			snapshot: `
class CustomError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'WrongError';
		~~~~~~~~~~~~~~~~~~~~~~~~
		Error subclass name property 'WrongError' should match the class name 'CustomError'.
	}
}
`,
		},
	],
	valid: [
		`class CustomError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CustomError';
	}
}`,
		`class FooError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'FooError';
	}
}`,
		`class MyTypeError extends TypeError {
	constructor() {
		super();
		this.name = 'MyTypeError';
	}
}`,
		`class NotAnError { constructor() {} }`,
		`class Counter { value = 0; }`,
	],
});
