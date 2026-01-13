import rule from "./caseDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
switch (value) {
    case 1:
        break;
    case 1:
        break;
}
`,
			snapshot: `
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
switch (value) {
    case x + 1:
        break;
    case x + 1:
        break;
}
`,
			snapshot: `
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
switch (value) {
    case obj.property:
        break;
    case obj.property:
        break;
}
`,
			snapshot: `
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
switch (value) {
    case 1: case 1: break;
}
`,
			snapshot: `
switch (value) {
    case 1: case 1: break;
            ~~~~~~
            This case duplicates a previous case, so it will never be reached.
}
`,
		},
		{
			code: `
const condition = true;
switch (value) {
    case condition ? "a" : "b":
        break;
    case condition ? "a" : "b":
        break;
}
`,
			snapshot: `
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
switch (value) {
    case /* comment */ 1:
        break;
    case 1:
        break;
}
`,
			snapshot: `
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
switch (value) {
    case obj.property:
        break;
    case obj /* comment */ .property:
        break;
}
`,
			snapshot: `
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
		`switch (value) { case 1: break; case 2: break; }`,
		`switch (value) { case 1: break; case 2: break; case 3: break; }`,
		`switch (value) { case "a": break; case "b": break; }`,
		`switch (value) { case true: break; case false: break; }`,
		`switch (value) { case 1: case 2: break; }`,
		`switch (value) { default: break; }`,
		`
switch (value) {
    case 1:
        break;
    case 2:
        break;
}
`,
		`
switch (value) {
    case x:
        break;
    case y:
        break;
}
`,
		`
switch (value) {
    case obj.a:
        break;
    case obj.b:
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
