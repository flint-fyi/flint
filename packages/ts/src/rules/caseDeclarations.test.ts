import rule from "./caseDeclarations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
switch (value) {
    case 1:
        let x = 1;
        break;
}
`,
			snapshot: `
switch (value) {
    case 1:
        let x = 1;
        ~~~
        Variables declared in case clauses without braces leak into the surrounding scope.
        break;
}
`,
		},
		{
			code: `
switch (value) {
    case 1:
        const x = 1;
        break;
}
`,
			snapshot: `
switch (value) {
    case 1:
        const x = 1;
        ~~~~~
        Variables declared in case clauses without braces leak into the surrounding scope.
        break;
}
`,
		},
		{
			code: `
switch (value) {
    case 1:
        function foo() {}
        break;
}
`,
			snapshot: `
switch (value) {
    case 1:
        function foo() {}
        ~~~~~~~~
        Variables declared in case clauses without braces leak into the surrounding scope.
        break;
}
`,
		},
		{
			code: `
switch (value) {
    case 1:
        class Foo {}
        break;
}
`,
			snapshot: `
switch (value) {
    case 1:
        class Foo {}
        ~~~~~
        Variables declared in case clauses without braces leak into the surrounding scope.
        break;
}
`,
		},
		{
			code: `
switch (value) {
    default:
        let x = 1;
        break;
}
`,
			snapshot: `
switch (value) {
    default:
        let x = 1;
        ~~~
        Variables declared in case clauses without braces leak into the surrounding scope.
        break;
}
`,
		},
		{
			code: `
switch (value) {
    default:
        const x = 1;
        break;
}
`,
			snapshot: `
switch (value) {
    default:
        const x = 1;
        ~~~~~
        Variables declared in case clauses without braces leak into the surrounding scope.
        break;
}
`,
		},
		{
			code: `
switch (value) {
    case 1:
        let x = 1;
    case 2:
        let y = 2;
        break;
}
`,
			snapshot: `
switch (value) {
    case 1:
        let x = 1;
        ~~~
        Variables declared in case clauses without braces leak into the surrounding scope.
    case 2:
        let y = 2;
        ~~~
        Variables declared in case clauses without braces leak into the surrounding scope.
        break;
}
`,
		},
		{
			code: `
switch (value) {
    case 1:
        const x = 1;
        console.log(x);
        break;
}
`,
			snapshot: `
switch (value) {
    case 1:
        const x = 1;
        ~~~~~
        Variables declared in case clauses without braces leak into the surrounding scope.
        console.log(x);
        break;
}
`,
		},
	],
	valid: [
		`switch (value) { case 1: { let x = 1; break; } }`,
		`switch (value) { case 1: { const x = 1; break; } }`,
		`switch (value) { case 1: { function foo() {} break; } }`,
		`switch (value) { case 1: { class Foo {} break; } }`,
		`switch (value) { default: { let x = 1; break; } }`,
		`switch (value) { default: { const x = 1; break; } }`,
		`switch (value) { case 1: var x = 1; break; }`,
		`switch (value) { case 1: break; }`,
		`switch (value) { case 1: console.log("test"); break; }`,
		`
switch (value) {
    case 1: {
        let x = 1;
        break;
    }
}
`,
		`
switch (value) {
    case 1: {
        const x = 1;
        break;
    }
}
`,
		`
switch (value) {
    case 1: {
        function foo() {}
        break;
    }
}
`,
		`
switch (value) {
    case 1: {
        class Foo {}
        break;
    }
}
`,
		`
switch (value) {
    case 1:
        var x = 1;
        break;
}
`,
		`
switch (value) {
    case 1: {
        let x = 1;
    }
    case 2: {
        let y = 2;
        break;
    }
}
`,
		`
switch (value) {
    default: {
        let x = 1;
        break;
    }
}
`,
	],
});
