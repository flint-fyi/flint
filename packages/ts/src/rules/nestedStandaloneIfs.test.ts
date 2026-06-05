import rule from "./nestedStandaloneIfs.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const condition: boolean;
declare const otherCondition: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (condition) {
    doSomething();
} else {
    if (otherCondition) {
        doSomethingElse();
    }
}
`,
			output: `
declare const condition: boolean;
declare const otherCondition: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (condition) {
    doSomething();
} else if (otherCondition) {
        doSomethingElse();
    }
`,
			snapshot: `
declare const condition: boolean;
declare const otherCondition: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (condition) {
    doSomething();
} else {
    if (otherCondition) {
    ~~~~~~~~~~~~~~~~~~~~~
    This \`if\` is the only statement in an \`else\` block and can be written as \`else if\`.
        doSomethingElse();
        ~~~~~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
declare const condition: boolean;
declare const otherCondition: boolean;
declare function doDefault(): void;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (condition) {
    doSomething();
} else {
    if (otherCondition) {
        doSomethingElse();
    } else {
        doDefault();
    }
}
`,
			output: `
declare const condition: boolean;
declare const otherCondition: boolean;
declare function doDefault(): void;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (condition) {
    doSomething();
} else if (otherCondition) {
        doSomethingElse();
    } else {
        doDefault();
    }
`,
			snapshot: `
declare const condition: boolean;
declare const otherCondition: boolean;
declare function doDefault(): void;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (condition) {
    doSomething();
} else {
    if (otherCondition) {
    ~~~~~~~~~~~~~~~~~~~~~
    This \`if\` is the only statement in an \`else\` block and can be written as \`else if\`.
        doSomethingElse();
        ~~~~~~~~~~~~~~~~~~
    } else {
    ~~~~~~~~
        doDefault();
        ~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
declare const a: boolean;
declare const b: boolean;
declare function doSomething(): void;

if (a) {
    if (b) {
        doSomething();
    }
}
`,
			output: `
declare const a: boolean;
declare const b: boolean;
declare function doSomething(): void;

if (a && b) {
        doSomething();
    }
`,
			snapshot: `
declare const a: boolean;
declare const b: boolean;
declare function doSomething(): void;

if (a) {
    if (b) {
    ~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
declare const a: boolean;
declare const b: boolean;
declare function doSomething(): void;

if (a)
    if (b)
        doSomething();
`,
			output: `
declare const a: boolean;
declare const b: boolean;
declare function doSomething(): void;

if (a && b) doSomething();
`,
			snapshot: `
declare const a: boolean;
declare const b: boolean;
declare function doSomething(): void;

if (a)
    if (b)
    ~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
`,
		},
		{
			code: `
declare const a: boolean;
declare const b: boolean;
declare const c: boolean;
declare function doSomething(): void;

if (a || b) {
    if (c) {
        doSomething();
    }
}
`,
			output: `
declare const a: boolean;
declare const b: boolean;
declare const c: boolean;
declare function doSomething(): void;

if ((a || b) && c) {
        doSomething();
    }
`,
			snapshot: `
declare const a: boolean;
declare const b: boolean;
declare const c: boolean;
declare function doSomething(): void;

if (a || b) {
    if (c) {
    ~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
declare const a: boolean;
declare const b: boolean;
declare const c: boolean;
declare function doSomething(): void;

if (a) {
    if (b || c) {
        doSomething();
    }
}
`,
			output: `
declare const a: boolean;
declare const b: boolean;
declare const c: boolean;
declare function doSomething(): void;

if (a && (b || c)) {
        doSomething();
    }
`,
			snapshot: `
declare const a: boolean;
declare const b: boolean;
declare const c: boolean;
declare function doSomething(): void;

if (a) {
    if (b || c) {
    ~~~~~~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
declare const a: boolean | undefined;
declare const b: boolean;
declare const c: boolean;
declare function doSomething(): void;

if (a ?? b) {
    if (c) {
        doSomething();
    }
}
`,
			output: `
declare const a: boolean | undefined;
declare const b: boolean;
declare const c: boolean;
declare function doSomething(): void;

if ((a ?? b) && c) {
        doSomething();
    }
`,
			snapshot: `
declare const a: boolean | undefined;
declare const b: boolean;
declare const c: boolean;
declare function doSomething(): void;

if (a ?? b) {
    if (c) {
    ~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
declare const a: boolean;
declare const b: boolean;
declare const c: boolean;
declare const condition: boolean;
declare function doSomething(): void;

if (a) {
    if (condition ? b : c) {
        doSomething();
    }
}
`,
			output: `
declare const a: boolean;
declare const b: boolean;
declare const c: boolean;
declare const condition: boolean;
declare function doSomething(): void;

if (a && (condition ? b : c)) {
        doSomething();
    }
`,
			snapshot: `
declare const a: boolean;
declare const b: boolean;
declare const c: boolean;
declare const condition: boolean;
declare function doSomething(): void;

if (a) {
    if (condition ? b : c) {
    ~~~~~~~~~~~~~~~~~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
declare const a: boolean;
declare const b: boolean;
declare const c: boolean;
declare const d: boolean;
declare function doSomething(): void;

if (a && b) {
    if (c && d) {
        doSomething();
    }
}
`,
			output: `
declare const a: boolean;
declare const b: boolean;
declare const c: boolean;
declare const d: boolean;
declare function doSomething(): void;

if (a && b && c && d) {
        doSomething();
    }
`,
			snapshot: `
declare const a: boolean;
declare const b: boolean;
declare const c: boolean;
declare const d: boolean;
declare function doSomething(): void;

if (a && b) {
    if (c && d) {
    ~~~~~~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
		{
			code: `
declare const otherValue: boolean;
declare const value: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (value) {
    doSomething();
} else {
    if (otherValue) doSomethingElse();
}
`,
			output: `
declare const otherValue: boolean;
declare const value: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (value) {
    doSomething();
} else if (otherValue) doSomethingElse();
`,
			snapshot: `
declare const otherValue: boolean;
declare const value: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (value) {
    doSomething();
} else {
    if (otherValue) doSomethingElse();
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This \`if\` is the only statement in an \`else\` block and can be written as \`else if\`.
}
`,
		},
		{
			code: `
declare const a: boolean;
declare function doSomething(): void;
declare function getValue(): boolean;
let assigned = false;

if (a) {
    if (assigned = getValue()) {
        doSomething();
    }
}
`,
			output: `
declare const a: boolean;
declare function doSomething(): void;
declare function getValue(): boolean;
let assigned = false;

if (a && (assigned = getValue())) {
        doSomething();
    }
`,
			snapshot: `
declare const a: boolean;
declare function doSomething(): void;
declare function getValue(): boolean;
let assigned = false;

if (a) {
    if (assigned = getValue()) {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This \`if\` is the only statement inside another \`if\` without an \`else\` and can be combined using \`&&\`.
        doSomething();
        ~~~~~~~~~~~~~~
    }
    ~
}
`,
		},
	],
	valid: [
		`
declare const condition: boolean;
declare function doSomething(): void;

if (condition) {
    doSomething();
}
`,
		`
declare const condition: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (condition) {
    doSomething();
} else {
    doSomethingElse();
}
`,
		`
declare const condition: boolean;
declare const otherCondition: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (condition) {
    doSomething();
} else if (otherCondition) {
    doSomethingElse();
}
`,
		`
declare const condition: boolean;
declare const otherCondition: boolean;
declare function doAnotherThing(): void;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (condition) {
    doSomething();
} else {
    if (otherCondition) {
        doSomethingElse();
    }
    doAnotherThing();
}
`,
		`
declare const condition: boolean;
declare const otherCondition: boolean;
declare function doAnotherThing(): void;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (condition) {
    doSomething();
} else {
    doAnotherThing();
    if (otherCondition) {
        doSomethingElse();
    }
}
`,
		`
declare const a: boolean;
declare const b: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (a) {
    if (b) {
        doSomething();
    }
} else {
    doSomethingElse();
}
`,
		`
declare const a: boolean;
declare const b: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (a) {
    if (b) {
        doSomething();
    } else {
        doSomethingElse();
    }
}
`,
		`
declare const a: boolean;
declare const b: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (a) {
    doSomething();
    if (b) {
        doSomethingElse();
    }
}
`,
		`
declare const a: boolean;
declare const b: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (a) {
    if (b) {
        doSomething();
    }
    doSomethingElse();
}
`,
		`
declare const condition: boolean;
declare const otherCondition: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (condition) {
    doSomething();
} else {
    // Comment explaining why
    if (otherCondition) {
        doSomethingElse();
    }
}
`,
		`
declare const condition: boolean;
declare const otherCondition: boolean;
declare function doSomething(): void;
declare function doSomethingElse(): void;

if (condition) {
    doSomething();
} else {
    if (otherCondition) {
        doSomethingElse();
    }
    // trailing comment
}
`,
		`
declare const a: boolean;
declare const b: boolean;
declare function doSomething(): void;

if (a) {
    // comment
    if (b) {
        doSomething();
    }
}
`,
		`
declare const a: boolean;
declare const b: boolean;
declare function doSomething(): void;

if (a) {
    if (b) {
        doSomething();
    }
    // trailing comment
}
`,
	],
});
