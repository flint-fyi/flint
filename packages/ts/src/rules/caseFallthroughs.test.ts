import rule from "./caseFallthroughs.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: number;
declare function doSomething(): void;
declare function doSomethingElse(): void;

switch (value) {
    case 1:
        doSomething();
    case 2:
        doSomethingElse();
        break;
}
`,
			snapshot: `
declare const value: number;
declare function doSomething(): void;
declare function doSomethingElse(): void;

switch (value) {
    case 1:
    ~~~~
    This case falls through to the next case without a break, return, or throw statement.
        doSomething();
    case 2:
        doSomethingElse();
        break;
}
`,
		},
		{
			code: `
declare const value: number;
declare function first(): void;
declare function second(): void;
declare function third(): void;

switch (value) {
    case 1:
        first();
    case 2:
        second();
    case 3:
        third();
        break;
}
`,
			snapshot: `
declare const value: number;
declare function first(): void;
declare function second(): void;
declare function third(): void;

switch (value) {
    case 1:
    ~~~~
    This case falls through to the next case without a break, return, or throw statement.
        first();
    case 2:
    ~~~~
    This case falls through to the next case without a break, return, or throw statement.
        second();
    case 3:
        third();
        break;
}
`,
		},
		{
			code: `
declare const condition: boolean;
declare const value: number;

switch (value) {
    case 1:
        if (condition) {
            break;
        }
    case 2:
        break;
}
`,
			snapshot: `
declare const condition: boolean;
declare const value: number;

switch (value) {
    case 1:
    ~~~~
    This case falls through to the next case without a break, return, or throw statement.
        if (condition) {
            break;
        }
    case 2:
        break;
}
`,
		},
	],
	valid: [
		`
declare const value: number;
declare function doSomething(): void;
declare function doSomethingElse(): void;

switch (value) {
    case 1:
        doSomething();
        break;
    case 2:
        doSomethingElse();
        break;
}
`,
		`
declare const value: number;
declare function first(): string;
declare function second(): string;

function getResult() {
    switch (value) {
        case 1:
            return first();
        case 2:
            return second();
    }
}
`,
		`
declare const value: number;

switch (value) {
    case 1:
        throw new Error("error");
    case 2:
        break;
}
`,
		`
declare const value: number;
declare function doSomething(): void;

switch (value) {
    case 1:
    case 2:
        doSomething();
        break;
}
`,
		`
declare const value: number;
declare function doSomething(): void;
declare function doSomethingElse(): void;

switch (value) {
    case 1:
        doSomething();
        // falls through
    case 2:
        doSomethingElse();
        break;
}
`,
		`
declare const value: number;
declare function doSomething(): void;
declare function doSomethingElse(): void;

switch (value) {
    case 1:
        doSomething();
        /* falls through */
    case 2:
        doSomethingElse();
        break;
}
`,
		`
declare const value: number;
declare function doSomething(): void;
declare function doSomethingElse(): void;

switch (value) {
    case 1:
        doSomething();
        // fall through
    case 2:
        doSomethingElse();
        break;
}
`,
		`
declare const condition: boolean;
declare const value: number;
declare function first(): string;
declare function second(): string;

function getResult() {
    switch (value) {
        case 1:
            if (condition) {
                return first();
            } else {
                return second();
            }
        case 2:
            break;
    }
}
`,
		`
declare const value: number;
declare function doDefault(): void;
declare function doSomething(): void;

switch (value) {
    case 1:
        doSomething();
        break;
    default:
        doDefault();
}
`,
	],
});
