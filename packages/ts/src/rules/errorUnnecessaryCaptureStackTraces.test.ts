import rule from "./errorUnnecessaryCaptureStackTraces.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class MyError extends Error {
    constructor() {
        super();
        Error.captureStackTrace(this, MyError);
    }
}
`,
			files: {
				"error.d.ts": `
interface ErrorConstructor {
    captureStackTrace(error: object, constructor?: unknown): void;
}
`,
			},
			snapshot: `
class MyError extends Error {
    constructor() {
        super();
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
        super();
        Error.captureStackTrace?.(this, MyError);
    }
}
`,
			files: {
				"error.d.ts": `
interface ErrorConstructor {
    captureStackTrace(error: object, constructor?: unknown): void;
}
`,
			},
			snapshot: `
class MyError extends Error {
    constructor() {
        super();
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
        super();
        Error.captureStackTrace(this, this.constructor);
    }
}
`,
			files: {
				"error.d.ts": `
interface ErrorConstructor {
    captureStackTrace(error: object, constructor?: unknown): void;
}
`,
			},
			snapshot: `
class MyError extends Error {
    constructor() {
        super();
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
        super();
        Error.captureStackTrace?.(this, this.constructor);
    }
}
`,
			files: {
				"error.d.ts": `
interface ErrorConstructor {
    captureStackTrace(error: object, constructor?: unknown): void;
}
`,
			},
			snapshot: `
class MyError extends Error {
    constructor() {
        super();
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
        super();
        Error.captureStackTrace(this, new.target);
    }
}
`,
			files: {
				"error.d.ts": `
interface ErrorConstructor {
    captureStackTrace(error: object, constructor?: unknown): void;
}
`,
			},
			snapshot: `
class MyError extends Error {
    constructor() {
        super();
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
        super();
        Error.captureStackTrace?.(this, new.target);
    }
}
`,
			files: {
				"error.d.ts": `
interface ErrorConstructor {
    captureStackTrace(error: object, constructor?: unknown): void;
}
`,
			},
			snapshot: `
class MyError extends Error {
    constructor() {
        super();
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
        super();
        Error.captureStackTrace(this, MyError);
    }
}
`,
			files: {
				"error.d.ts": `
interface ErrorConstructor {
    captureStackTrace(error: object, constructor?: unknown): void;
}
`,
			},
			snapshot: `
class MyError extends TypeError {
    constructor() {
        super();
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
		{
			code: `class CustomError {}
class MyError extends CustomError {
	constructor() {
		super();
		Error.captureStackTrace(this, MyError);
	}
}`,
			files: {
				"error.d.ts": `
interface ErrorConstructor {
    captureStackTrace(error: object, constructor?: unknown): void;
}
`,
			},
		},
		{
			code: `class MyClass {
	constructor() {
		Error.captureStackTrace(this, MyClass);
	}
}`,
			files: {
				"error.d.ts": `
interface ErrorConstructor {
    captureStackTrace(error: object, constructor?: unknown): void;
}
`,
			},
		},
		{
			code: `class OtherClass {}
class MyError extends Error {
	constructor() {
		super();
		Error.captureStackTrace(this, OtherClass);
	}
}`,
			files: {
				"error.d.ts": `
interface ErrorConstructor {
    captureStackTrace(error: object, constructor?: unknown): void;
}
`,
			},
		},
	],
});
