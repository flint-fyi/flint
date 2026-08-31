import rule from "./defaultCaseLast.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: number;

switch (value) {
    default:
        break;
    case 1:
        break;
}
`,
			snapshot: `
declare const value: number;

switch (value) {
    default:
    ~~~~~~~
    Default clauses in switch statements should be last.
        break;
    case 1:
        break;
}
`,
		},
		{
			code: `
declare const value: number;

switch (value) {
    case 1:
        break;
    default:
        break;
    case 2:
        break;
}
`,
			snapshot: `
declare const value: number;

switch (value) {
    case 1:
        break;
    default:
    ~~~~~~~
    Default clauses in switch statements should be last.
        break;
    case 2:
        break;
}
`,
		},
		{
			code: `
declare const value: number;

switch (value) {
    case 1:
    case 2:
        break;
    default:
        break;
    case 3:
        break;
}
`,
			snapshot: `
declare const value: number;

switch (value) {
    case 1:
    case 2:
        break;
    default:
    ~~~~~~~
    Default clauses in switch statements should be last.
        break;
    case 3:
        break;
}
`,
		},
		{
			code: `
declare const value: number;

switch (value) {
    default:
        void "default";
        break;
    case 1:
        void "one";
        break;
}
`,
			snapshot: `
declare const value: number;

switch (value) {
    default:
    ~~~~~~~
    Default clauses in switch statements should be last.
        void "default";
        break;
    case 1:
        void "one";
        break;
}
`,
		},
		{
			code: `
const result = (value: number) => {
    switch (value) {
        case 1:
            return "one";
        default:
            return "default";
        case 2:
            return "two";
    }
};
result(1);
`,
			snapshot: `
const result = (value: number) => {
    switch (value) {
        case 1:
            return "one";
        default:
        ~~~~~~~
        Default clauses in switch statements should be last.
            return "default";
        case 2:
            return "two";
    }
};
result(1);
`,
		},
		{
			code: `
declare const value: number;

switch (value) {
    default:
    case 1:
        break;
}
`,
			snapshot: `
declare const value: number;

switch (value) {
    default:
    ~~~~~~~
    Default clauses in switch statements should be last.
    case 1:
        break;
}
`,
		},
	],
	valid: [
		`
declare const value: number;

switch (value) { case 1: break; default: break; }
`,
		`
declare const value: number;

switch (value) { case 1: break; case 2: break; default: break; }
`,
		`
declare const value: number;

switch (value) { case 1: break; case 2: break; }
`,
		`
declare const value: number;

switch (value) { default: break; }
`,
		`
declare const value: number;

switch (value) { case 1: case 2: break; default: break; }
`,
		`
declare const value: number;

switch (value) {
    case 1:
        break;
    default:
        break;
}
`,
		`
declare const value: number;

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
const result = (value: number) => {
    switch (value) {
        case 1:
            return "one";
        case 2:
            return "two";
        default:
            return "default";
    }
};
result(1);
`,
		`
declare const value: number;

switch (value) {
    case 1:
    case 2:
        break;
    default:
        break;
}
`,
	],
});
