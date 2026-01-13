import { ruleTester } from "./ruleTester.ts";
import rule from "./voidOperator.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
void 0;
`,
			snapshot: `
void 0;
~~~~~~
Prefer an explicit value over using the void operator to produce undefined.
`,
		},
		{
			code: `
const value = void 0;
`,
			snapshot: `
const value = void 0;
              ~~~~~~
              Prefer an explicit value over using the void operator to produce undefined.
`,
		},
		{
			code: `
void someFunction();
`,
			snapshot: `
void someFunction();
~~~~~~~~~~~~~~~~~~~
Prefer an explicit value over using the void operator to produce undefined.
`,
		},
		{
			code: `
return void calculate();
`,
			snapshot: `
return void calculate();
       ~~~~~~~~~~~~~~~~
       Prefer an explicit value over using the void operator to produce undefined.
`,
		},
		{
			code: `
const result = void (a + b);
`,
			snapshot: `
const result = void (a + b);
               ~~~~~~~~~~~~
               Prefer an explicit value over using the void operator to produce undefined.
`,
		},
		{
			code: `
void expression, anotherExpression;
`,
			snapshot: `
void expression, anotherExpression;
~~~~~~~~~~~~~~~
Prefer an explicit value over using the void operator to produce undefined.
`,
		},
		{
			code: `
function process() {
	void doSomething();
}
`,
			snapshot: `
function process() {
	void doSomething();
	~~~~~~~~~~~~~~~~~~
	Prefer an explicit value over using the void operator to produce undefined.
}
`,
		},
		{
			code: `
const callback = () => void action();
`,
			snapshot: `
const callback = () => void action();
                       ~~~~~~~~~~~~~
                       Prefer an explicit value over using the void operator to produce undefined.
`,
		},
	],
	valid: [
		`const value = undefined;`,
		`return undefined;`,
		`someFunction();`,
		`const result = doSomething();`,
		`if (value === undefined) {}`,
		`function returns() { return; }`,
	],
});
