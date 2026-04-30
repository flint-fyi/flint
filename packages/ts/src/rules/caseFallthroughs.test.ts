import rule from "./caseFallthroughs.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
switch (value) {
    case 1:
        doSomething();
    case 2:
        doSomethingElse();
        break;
}
`,
			snapshot: `
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
switch (value) {
    case 1:
        return first();
    case 2:
        return second();
}
`,
		`
switch (value) {
    case 1:
        throw new Error("error");
    case 2:
        break;
}
`,
		`
switch (value) {
    case 1:
    case 2:
        doSomething();
        break;
}
`,
		`
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
`,
		`
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
