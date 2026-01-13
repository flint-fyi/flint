import rule from "./constructorReturns.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class Example {
    constructor() {
        return {};
    }
}
`,
			snapshot: `
class Example {
    constructor() {
        return {};
        ~~~~~~~~~~
        Returning a value from a constructor function overrides the newly created instance.
    }
}
`,
		},
		{
			code: `
class Example {
    constructor() {
        return { value: 1 };
    }
}
`,
			snapshot: `
class Example {
    constructor() {
        return { value: 1 };
        ~~~~~~~~~~~~~~~~~~~~
        Returning a value from a constructor function overrides the newly created instance.
    }
}
`,
		},
		{
			code: `
class Example {
    constructor() {
        if (condition) {
            return new OtherClass();
        }
    }
}
`,
			snapshot: `
class Example {
    constructor() {
        if (condition) {
            return new OtherClass();
            ~~~~~~~~~~~~~~~~~~~~~~~~
            Returning a value from a constructor function overrides the newly created instance.
        }
    }
}
`,
		},
		{
			code: `
class Example {
    constructor(value: number) {
        if (value < 0) {
            return null;
        }
        this.value = value;
    }
}
`,
			snapshot: `
class Example {
    constructor(value: number) {
        if (value < 0) {
            return null;
            ~~~~~~~~~~~~
            Returning a value from a constructor function overrides the newly created instance.
        }
        this.value = value;
    }
}
`,
		},
	],
	valid: [
		`class Example { constructor() {} }`,
		`class Example { constructor() { this.value = 1; } }`,
		`class Example { constructor() { return; } }`,
		`class Example { constructor() { if (condition) { return; } this.value = 1; } }`,
		`class Example { constructor() { const factory = () => { return {}; }; } }`,
		`class Example { constructor() { function helper() { return 1; } } }`,
	],
});
