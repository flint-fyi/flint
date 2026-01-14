import rule from "./meaninglessVoidOperators.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
void (() => {})();
`,
			snapshot: `
void (() => {})();
~~~~~~~~~~~~~~~~~
Using the \`void\` operator on a value of type \`void\` is meaningless.
`,
		},
		{
			code: `
function getValue() {}
void getValue();
`,
			snapshot: `
function getValue() {}
void getValue();
~~~~~~~~~~~~~~~
Using the \`void\` operator on a value of type \`void\` is meaningless.
`,
		},
		{
			code: `
const value: undefined = undefined;
void value;
`,
			snapshot: `
const value: undefined = undefined;
void value;
~~~~~~~~~~
Using the \`void\` operator on a value of type \`undefined\` is meaningless.
`,
		},
		{
			code: `
function getValue(): void | undefined {
    return;
}
void getValue();
`,
			snapshot: `
function getValue(): void | undefined {
    return;
}
void getValue();
~~~~~~~~~~~~~~~
Using the \`void\` operator on a value of type \`void | undefined\` is meaningless.
`,
		},
		{
			code: `
declare const getValue: () => void;
void getValue();
`,
			snapshot: `
declare const getValue: () => void;
void getValue();
~~~~~~~~~~~~~~~
Using the \`void\` operator on a value of type \`void\` is meaningless.
`,
		},
		{
			code: `
async function getValue() {}
void void getValue();
`,
			snapshot: `
async function getValue() {}
void void getValue();
~~~~~~~~~~~~~~~~~~~~
Using the \`void\` operator on a value of type \`undefined\` is meaningless.
`,
		},
	],
	valid: [
		`function getValue(x: number) { void x; return 2; }`,
		`void (async () => {})();`,
		`function getValue() { return 1; } void getValue();`,
		`const getValue = (): number => 1; void getValue();`,
		`declare const value: unknown; void value;`,
		`declare const value: any; void value;`,
		`declare const value: string | number; void value;`,
		`declare const value: void | number; void value;`,
	],
});
