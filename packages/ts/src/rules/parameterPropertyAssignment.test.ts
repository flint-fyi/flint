import rule from "./parameterPropertyAssignment.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		// TODO: Implement detection logic
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
