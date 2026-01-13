import { ruleTester } from "./ruleTester.ts";
import rule from "./sequences.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const a = (1, 2);
`,
			snapshot: `
const a = (1, 2);
            ~
            The "sequence" (comma) operator is often confusing and a sign of mistaken logic.
`,
		},
		{
			code: `
function f() {
    return (g(), h());
}
`,
			snapshot: `
function f() {
    return (g(), h());
               ~
               The "sequence" (comma) operator is often confusing and a sign of mistaken logic.
}
`,
		},
		{
			code: `
for ((a = 1, b = 2); ; ) {
}
`,
			snapshot: `
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
		`function f() { g(); h(); }`,
		`for (let i = 0; i < 10; i += 1) {}`,
	],
});
