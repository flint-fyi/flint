import rule from "./parameterPropertyAssignment.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
class MyClass {
	constructor(value: string) {
		this.value = value;
	}
}
`,
			snapshot: `
class MyClass {
	constructor(value: string) {
		this.value = value;
		~~~~~~~~~~~~~~~~~~
		Parameter property assignment is unnecessary.
	}
}
`,
		},
		{
			code: `
class Service {
	update(data: object) {
		this.data = data;
	}
}
`,
			snapshot: `
class Service {
	update(data: object) {
		this.data = data;
		~~~~~~~~~~~~~~~~
		Parameter property assignment is unnecessary.
	}
}
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
