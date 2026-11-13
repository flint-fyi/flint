import { javascriptRuleTester } from "./ruleTester.ts";
import rule from "./undefinedVariables.ts";

javascriptRuleTester.describe(rule, {
	invalid: [
		{
			files: {
				"file.js": `
undefinedVar;
`,
			},
			snapshot: {
				"file.js": `
undefinedVar;
~~~~~~~~~~~~
Variable 'undefinedVar' is used but was never defined.
`,
			},
		},
	],
	valid: [
		{
			files: {
				"file.js": `const value = 5; value;`,
			},
		},
		{
			files: {
				"file.js": `function test(parameter) { return parameter; } test(1);`,
			},
		},
		{
			files: {
				"file.js": `let count = 0; count++;`,
			},
		},
		{
			files: {
				"file.js": `const obj = { prop: 1 }; obj.prop;`,
			},
		},
		{
			files: {
				"file.js": `const obj = { prop: undefined }; const { prop } = obj; prop;`,
			},
		},
		{
			files: {
				"file.js": `function fn() { return 1; } fn();`,
			},
		},
		{
			files: {
				"file.js": `class MyClass {} const instance = new MyClass(); instance;`,
			},
		},
		{
			files: {
				"file.js": `import { value } from "module"; value;`,
				"node_modules/module/index.d.ts": `
export const value: unknown;
`,
			},
		},
		{
			files: {
				"file.js": `const array = [1, 2, 3]; array.forEach(item => item);`,
			},
		},
	],
});
