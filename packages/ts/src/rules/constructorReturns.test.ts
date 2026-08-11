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
declare const condition: boolean;

class Example {
    constructor() {
        if (condition) {
            return new Example();
        }
    }
}
`,
			snapshot: `
declare const condition: boolean;

class Example {
    constructor() {
        if (condition) {
            return new Example();
            ~~~~~~~~~~~~~~~~~~~~~
            Returning a value from a constructor function overrides the newly created instance.
        }
    }
}
`,
		},
	],
	valid: [
		`class Example { constructor() {} }`,
		`
class Example {
    value = 0;

    constructor() {
        this.value = 1;
    }
}
`,
		`class Example { constructor() { return; } }`,
		`
declare const condition: boolean;

class Example {
    value = 0;

    constructor() {
        if (condition) {
            return;
        }

        this.value = 1;
    }
}
`,
		`class Example { constructor() { const factory = () => { return {}; }; } }`,
		`class Example { constructor() { function helper() { return 1; } } }`,
	],
});
