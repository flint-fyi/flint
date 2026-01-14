import rule from "./defaultCaseLast.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
switch (value) {
    default:
        break;
    case 1:
        break;
}
`,
			snapshot: `
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
switch (value) {
    default:
        console.log("default");
        break;
    case 1:
        console.log("one");
        break;
}
`,
			snapshot: `
switch (value) {
    default:
    ~~~~~~~
    Default clauses in switch statements should be last.
        console.log("default");
        break;
    case 1:
        console.log("one");
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
`,
		},
		{
			code: `
switch (value) {
    default:
    case 1:
        break;
}
`,
			snapshot: `
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
		`switch (value) { case 1: break; default: break; }`,
		`switch (value) { case 1: break; case 2: break; default: break; }`,
		`switch (value) { case 1: break; case 2: break; }`,
		`switch (value) { default: break; }`,
		`switch (value) { case 1: case 2: break; default: break; }`,
		`
switch (value) {
    case 1:
        break;
    default:
        break;
}
`,
		`
switch (value) {
    case 1:
        console.log("one");
        break;
    case 2:
        console.log("two");
        break;
    default:
        console.log("default");
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
`,
		`
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
