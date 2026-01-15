import rule from "./evals.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
eval("alert(1)");
`,
			snapshot: `
eval("alert(1)");
~~~~
Avoid using \`eval()\` as it poses security and performance risks.
`,
		},
		{
			code: `
const other = eval;
other("alert(1)");
`,
			snapshot: `
const other = eval;
other("alert(1)");
~~~~~
Avoid using \`eval()\` as it poses security and performance risks.
`,
		},
		{
			code: `
const result = eval(code);
`,
			snapshot: `
const result = eval(code);
               ~~~~
               Avoid using \`eval()\` as it poses security and performance risks.
`,
		},
	],
	valid: [
		`const obj = { eval: (code: string) => code }; obj.eval("test");`,
		`function myEval(code: string) { return code; } myEval("test");`,
		`class Foo { eval(code: string) { return code; } } new Foo().eval("test");`,
		`
function eval () {};
eval("alert(1)");
export {};
`,
		`
const eval = () => {};
eval("alert(1)");
export {};
`,
	],
});
