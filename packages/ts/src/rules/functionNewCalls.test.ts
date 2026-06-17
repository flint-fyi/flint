import rule from "./functionNewCalls.ts";
import { domLibRuleTester, ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const fn = new Function("a", "b", "return a + b");
`,
			snapshot: `
const fn = new Function("a", "b", "return a + b");
               ~~~~~~~~
               Dynamically creating functions with the Function constructor is insecure and slow.
`,
		},
		{
			code: `
const fn = Function("a", "return a");
`,
			snapshot: `
const fn = Function("a", "return a");
           ~~~~~~~~
           Dynamically creating functions with the Function constructor is insecure and slow.
`,
		},
		{
			code: `
const fn = new Function("return 1");
`,
			snapshot: `
const fn = new Function("return 1");
               ~~~~~~~~
               Dynamically creating functions with the Function constructor is insecure and slow.
`,
		},
		{
			code: `
const fn = Function();
`,
			snapshot: `
const fn = Function();
           ~~~~~~~~
           Dynamically creating functions with the Function constructor is insecure and slow.
`,
		},
		{
			code: `
const fn = new globalThis.Function("return 1");
`,
			snapshot: `
const fn = new globalThis.Function("return 1");
               ~~~~~~~~~~~~~~~~~~~
               Dynamically creating functions with the Function constructor is insecure and slow.
`,
		},
		{
			code: `
const fn = globalThis.Function("return 1");
`,
			snapshot: `
const fn = globalThis.Function("return 1");
           ~~~~~~~~~~~~~~~~~~~
           Dynamically creating functions with the Function constructor is insecure and slow.
`,
		},
		{
			code: `
const result = new Function("a", "b", "return a + b")(1, 2);
void result;
`,
			snapshot: `
const result = new Function("a", "b", "return a + b")(1, 2);
                   ~~~~~~~~
                   Dynamically creating functions with the Function constructor is insecure and slow.
void result;
`,
		},
		{
			code: `
const CustomFunction = Function;
const fn = new CustomFunction();
void fn;
`,
			snapshot: `
const CustomFunction = Function;
const fn = new CustomFunction();
               ~~~~~~~~~~~~~~
               Dynamically creating functions with the Function constructor is insecure and slow.
void fn;
`,
		},
	],
	valid: [
		`const fn = function(a: number, b: number) { return a + b; }; void fn;`,
		`const fn = (a: number, b: number) => a + b; void fn;`,
		`function add(a: number, b: number) { return a + b; } add(1, 2);`,
		`class MyFunction {} new MyFunction();`,
		`class MyFunction {} const fn = new MyFunction(); void fn;`,
	],
});

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
const fn = new window.Function("return 1");
`,
			snapshot: `
const fn = new window.Function("return 1");
               ~~~~~~~~~~~~~~~
               Dynamically creating functions with the Function constructor is insecure and slow.
`,
		},
		{
			code: `
const fn = window.Function("return 1");
`,
			snapshot: `
const fn = window.Function("return 1");
           ~~~~~~~~~~~~~~~
           Dynamically creating functions with the Function constructor is insecure and slow.
`,
		},
	],
	valid: [`window.addEventListener("load", () => {});`],
});
