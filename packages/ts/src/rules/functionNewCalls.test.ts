import rule from "./functionNewCalls.ts";
import { ruleTester } from "./ruleTester.ts";

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
		{
			code: `
const result = new Function("a", "b", "return a + b")(1, 2);
`,
			snapshot: `
const result = new Function("a", "b", "return a + b")(1, 2);
                   ~~~~~~~~
                   Dynamically creating functions with the Function constructor is insecure and slow.
`,
		},
		{
			code: `
const CustomFunction = Function;
const fn = new CustomFunction();
`,
			snapshot: `
const CustomFunction = Function;
const fn = new CustomFunction();
               ~~~~~~~~~~~~~~
               Dynamically creating functions with the Function constructor is insecure and slow.
`,
		},
	],
	valid: [
		`const fn = function(a, b) { return a + b; };`,
		`const fn = (a, b) => a + b;`,
		`function add(a, b) { return a + b; }`,
		`class MyFunction {}`,
		`const fn = new MyFunction();`,
	],
});
