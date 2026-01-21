import rule from "./parameterPropertyAssignment.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const x = 1;
`,
			snapshot: `
const x = 1;
`,
		},
	],
	valid: [
		`
class MyClass {
	constructor(value: string) {
		this.other = value;
	}
}
`,
		`
function fn(x: number) {
	this.x = x;
}
`,
		`
class MyClass {
	prop: string;
	constructor(value: string) {
		this.prop = value;
	}
}
`,
	],
});
