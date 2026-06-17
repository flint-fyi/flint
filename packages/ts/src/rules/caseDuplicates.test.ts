import rule from "./caseDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: unknown;
switch (value) {
    case 1:
        break;
    case 1:
        break;
}
`,
			snapshot: `
declare const value: unknown;
switch (value) {
    case 1:
        break;
    case 1:
    ~~~~~~
    This case duplicates a previous case, so it will never be reached.
        break;
}
`,
		},
		{
			code: `
declare const value: unknown;
switch (value) {
    case "a":
        break;
    case "b":
        break;
    case "a":
        break;
}
`,
			snapshot: `
declare const value: unknown;
switch (value) {
    case "a":
        break;
    case "b":
        break;
    case "a":
    ~~~~~~~~
    This case duplicates a previous case, so it will never be reached.
        break;
}
`,
		},
		{
			code: `
declare const value: unknown;
declare const x: number;
switch (value) {
    case x + 1:
        break;
    case x + 1:
        break;
}
`,
			snapshot: `
declare const value: unknown;
declare const x: number;
switch (value) {
    case x + 1:
        break;
    case x + 1:
    ~~~~~~~~~~
    This case duplicates a previous case, so it will never be reached.
        break;
}
`,
		},
		{
			code: `
declare const value: unknown;
switch (value) {
    case 1:
        break;
    case 2:
        break;
    case 1:
        break;
}
`,
			snapshot: `
declare const value: unknown;
switch (value) {
    case 1:
        break;
    case 2:
        break;
    case 1:
    ~~~~~~
    This case duplicates a previous case, so it will never be reached.
        break;
}
`,
		},
		{
			code: `
declare const value: unknown;
switch (value) {
    case true:
        break;
    case false:
        break;
    case true:
        break;
}
`,
			snapshot: `
declare const value: unknown;
switch (value) {
    case true:
        break;
    case false:
        break;
    case true:
    ~~~~~~~~~
    This case duplicates a previous case, so it will never be reached.
        break;
}
`,
		},
		{
			code: `
declare const value: unknown;
declare const obj: { property: number };
switch (value) {
    case obj.property:
        break;
    case obj.property:
        break;
}
`,
			snapshot: `
declare const value: unknown;
declare const obj: { property: number };
switch (value) {
    case obj.property:
        break;
    case obj.property:
    ~~~~~~~~~~~~~~~~~
    This case duplicates a previous case, so it will never be reached.
        break;
}
`,
		},
		{
			code: `
const result = (input: number) => {
    switch (input) {
        case 1:
            return "one";
        case 2:
            return "two";
        case 1:
            return "duplicate";
    }
};
`,
			snapshot: `
const result = (input: number) => {
    switch (input) {
        case 1:
            return "one";
        case 2:
            return "two";
        case 1:
        ~~~~~~
        This case duplicates a previous case, so it will never be reached.
            return "duplicate";
    }
};
`,
		},
		{
			code: `
declare const value: unknown;
switch (value) {
    case 1: case 1: break;
}
`,
			snapshot: `
declare const value: unknown;
switch (value) {
    case 1: case 1: break;
            ~~~~~~
            This case duplicates a previous case, so it will never be reached.
}
`,
		},
		{
			code: `
declare const value: unknown;
const condition = true;
switch (value) {
    case condition ? "a" : "b":
        break;
    case condition ? "a" : "b":
        break;
}
`,
			snapshot: `
declare const value: unknown;
const condition = true;
switch (value) {
    case condition ? "a" : "b":
        break;
    case condition ? "a" : "b":
    ~~~~~~~~~~~~~~~~~~~~~~~~~~
    This case duplicates a previous case, so it will never be reached.
        break;
}
`,
		},
		{
			code: `
declare const value: unknown;
switch (value) {
    case /* comment */ 1:
        break;
    case 1:
        break;
}
`,
			snapshot: `
declare const value: unknown;
switch (value) {
    case /* comment */ 1:
        break;
    case 1:
    ~~~~~~
    This case duplicates a previous case, so it will never be reached.
        break;
}
`,
		},
		{
			code: `
declare const value: unknown;
declare const obj: { property: number };
switch (value) {
    case obj.property:
        break;
    case obj /* comment */ .property:
        break;
}
`,
			snapshot: `
declare const value: unknown;
declare const obj: { property: number };
switch (value) {
    case obj.property:
        break;
    case obj /* comment */ .property:
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This case duplicates a previous case, so it will never be reached.
        break;
}
`,
		},
	],
	valid: [
		`
declare const value: unknown;
switch (value) { case 1: break; case 2: break; }
`,
		`
declare const value: unknown;
switch (value) { case 1: break; case 2: break; case 3: break; }
`,
		`
declare const value: unknown;
switch (value) { case "a": break; case "b": break; }
`,
		`
declare const value: unknown;
switch (value) { case true: break; case false: break; }
`,
		`
declare const value: unknown;
switch (value) { case 1: case 2: break; }
`,
		`
declare const value: unknown;
switch (value) { default: break; }
`,
		`
declare const value: unknown;
switch (value) {
    case 1:
        break;
    case 2:
        break;
}
`,
		`
declare const value: unknown;
declare const x: number;
declare const y: number;
switch (value) {
    case x:
        break;
    case y:
        break;
}
`,
		`
declare const value: unknown;
declare const obj: { a: number; b: number };
switch (value) {
    case obj.a:
        break;
    case obj.b:
        break;
}
`,
		`
declare const value: unknown;
switch (value) {
    case 1:
        void "one";
        break;
    case 2:
        void "two";
        break;
    default:
        void "default";
        break;
}
`,
		`
declare const value: unknown;
declare const x: number;
switch (value) {
    case x + 1:
        break;
    case x + 2:
        break;
}
`,
		`
const result = (input: number) => {
    switch (input) {
        case 1:
            return "one";
        case 2:
            return "two";
        default:
            return "unknown";
    }
};
`,
	],
});
