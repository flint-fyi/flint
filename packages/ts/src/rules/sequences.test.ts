import { ruleTester } from "./ruleTester.ts";
import rule from "./sequences.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function getValue() {
    return 1;
}

const a = (getValue(), 2);
`,
			snapshot: `
function getValue() {
    return 1;
}

const a = (getValue(), 2);
                     ~
                     The "sequence" (comma) operator is often confusing and a sign of mistaken logic.
`,
		},
		{
			code: `
function g() {
    return 1;
}

function h() {
    return 2;
}

function f() {
    return (g(), h());
}
`,
			snapshot: `
function g() {
    return 1;
}

function h() {
    return 2;
}

function f() {
    return (g(), h());
               ~
               The "sequence" (comma) operator is often confusing and a sign of mistaken logic.
}
`,
		},
		{
			code: `
let a = 0;
let b = 0;

for ((a = 1, b = 2); ; ) {
}
`,
			snapshot: `
let a = 0;
let b = 0;

for ((a = 1, b = 2); ; ) {
           ~
           The "sequence" (comma) operator is often confusing and a sign of mistaken logic.
}
`,
		},
	],
	valid: [
		`const a = [1, 2];`,
		`const a = (1 + 2);`,
		`function g() {} function h() {} function f() { g(); h(); }`,
		`for (let i = 0; i < 10; i += 1) {}`,
	],
});
