import rule from "./caseDeclarations.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: number;
switch (value) {
    case 1:
        let x = 1;
        break;
}
`,
			snapshot: `
declare const value: number;
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
declare const value: number;
switch (value) {
    case 1:
        const x = 1;
        break;
}
`,
			snapshot: `
declare const value: number;
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
declare const value: number;
switch (value) {
    case 1:
        function foo() {}
        break;
}
`,
			snapshot: `
declare const value: number;
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
declare const value: number;
switch (value) {
    case 1:
        class Foo {}
        break;
}
`,
			snapshot: `
declare const value: number;
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
declare const value: number;
switch (value) {
    default:
        let x = 1;
        break;
}
`,
			snapshot: `
declare const value: number;
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
declare const value: number;
switch (value) {
    default:
        const x = 1;
        break;
}
`,
			snapshot: `
declare const value: number;
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
declare const value: number;
switch (value) {
    case 1:
        let x = 1;
    case 2:
        let y = 2;
        break;
}
`,
			snapshot: `
declare const value: number;
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
declare const value: number;
switch (value) {
    case 1:
        const x = 1;
        void x;
        break;
}
`,
			snapshot: `
declare const value: number;
switch (value) {
    case 1:
        const x = 1;
        ~~~~~
        Variables declared in case clauses without braces leak into the surrounding scope.
        void x;
        break;
}
`,
		},
	],
	valid: [
		`
declare const value: number;
switch (value) { case 1: { let x = 1; break; } }
`,
		`
declare const value: number;
switch (value) { case 1: { const x = 1; break; } }
`,
		`
declare const value: number;
switch (value) { case 1: { function foo() {} break; } }
`,
		`
declare const value: number;
switch (value) { case 1: { class Foo {} break; } }
`,
		`
declare const value: number;
switch (value) { default: { let x = 1; break; } }
`,
		`
declare const value: number;
switch (value) { default: { const x = 1; break; } }
`,
		`
declare const value: number;
switch (value) { case 1: var x = 1; break; }
`,
		`
declare const value: number;
switch (value) { case 1: break; }
`,
		`
declare const value: number;
switch (value) { case 1: void "test"; break; }
`,
		`
declare const value: number;
switch (value) {
    case 1: {
        let x = 1;
        break;
    }
}
`,
		`
declare const value: number;
switch (value) {
    case 1: {
        const x = 1;
        break;
    }
}
`,
		`
declare const value: number;
switch (value) {
    case 1: {
        function foo() {}
        break;
    }
}
`,
		`
declare const value: number;
switch (value) {
    case 1: {
        class Foo {}
        break;
    }
}
`,
		`
declare const value: number;
switch (value) {
    case 1:
        var x = 1;
        break;
}
`,
		`
declare const value: number;
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
declare const value: number;
switch (value) {
    default: {
        let x = 1;
        break;
    }
}
`,
	],
});
