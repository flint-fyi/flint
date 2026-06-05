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
declare function someFunction(): void;

void someFunction();
`,
			snapshot: `
declare function someFunction(): void;

void someFunction();
~~~~~~~~~~~~~~~~~~~
Prefer an explicit value over using the void operator to produce undefined.
`,
		},
		{
			code: `
declare function calculate(): number;

function getValue() {
	return void calculate();
}
`,
			snapshot: `
declare function calculate(): number;

function getValue() {
	return void calculate();
	       ~~~~~~~~~~~~~~~~
	       Prefer an explicit value over using the void operator to produce undefined.
}
`,
		},
		{
			code: `
declare const a: number;
declare const b: number;

const result = void (a + b);
`,
			snapshot: `
declare const a: number;
declare const b: number;

const result = void (a + b);
               ~~~~~~~~~~~~
               Prefer an explicit value over using the void operator to produce undefined.
`,
		},
		{
			code: `
declare const expression: unknown;
declare const anotherExpression: unknown;

void expression, anotherExpression;
`,
			snapshot: `
declare const expression: unknown;
declare const anotherExpression: unknown;

void expression, anotherExpression;
~~~~~~~~~~~~~~~
Prefer an explicit value over using the void operator to produce undefined.
`,
		},
		{
			code: `
declare function doSomething(): void;

function process() {
	void doSomething();
}
`,
			snapshot: `
declare function doSomething(): void;

function process() {
	void doSomething();
	~~~~~~~~~~~~~~~~~~
	Prefer an explicit value over using the void operator to produce undefined.
}
`,
		},
		{
			code: `
declare function action(): void;

const callback = () => void action();
`,
			snapshot: `
declare function action(): void;

const callback = () => void action();
                       ~~~~~~~~~~~~~
                       Prefer an explicit value over using the void operator to produce undefined.
`,
		},
	],
	valid: [
		`const value = undefined;`,
		`function getValue() { return undefined; }`,
		`
declare function someFunction(): void;

someFunction();
`,
		`
declare function doSomething(): number;

const result = doSomething();
`,
		`
declare const value: unknown;

if (value === undefined) {}
`,
		`function returns() { return; }`,
	],
});
