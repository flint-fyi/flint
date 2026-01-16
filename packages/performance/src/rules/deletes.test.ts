import rule from "./deletes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const object = { property: "value" };
delete object.property;
`,
			snapshot: `
const object = { property: "value" };
delete object.property;
~~~~~~
Using the delete operator prevents optimizations in JavaScript engines.
`,
		},
		{
			code: `
const object = { first: 1, second: 2 };
delete object["first"];
`,
			snapshot: `
const object = { first: 1, second: 2 };
delete object["first"];
~~~~~~
Using the delete operator prevents optimizations in JavaScript engines.
`,
		},
		{
			code: `
class Example {
    method() {
        delete this.property;
    }
}
`,
			snapshot: `
class Example {
    method() {
        delete this.property;
        ~~~~~~
        Using the delete operator prevents optimizations in JavaScript engines.
    }
}
`,
		},
		{
			code: `
function removeProperty(object: any, key: string) {
    delete object[key];
}
`,
			snapshot: `
function removeProperty(object: any, key: string) {
    delete object[key];
    ~~~~~~
    Using the delete operator prevents optimizations in JavaScript engines.
}
`,
		},
		{
			code: `
const array = [1, 2, 3];
delete array[0];
`,
			snapshot: `
const array = [1, 2, 3];
delete array[0];
~~~~~~
Using the delete operator prevents optimizations in JavaScript engines.
`,
		},
		{
			code: `
const nested = { outer: { inner: "value" } };
delete nested.outer.inner;
`,
			snapshot: `
const nested = { outer: { inner: "value" } };
delete nested.outer.inner;
~~~~~~
Using the delete operator prevents optimizations in JavaScript engines.
`,
		},
	],
	valid: [
		`
const object = { property: "value" };
object.property = undefined;
`,
		`
const object = { property: "value" };
const { property, ...rest } = object;
`,
		`
const map = new Map();
map.set("key", "value");
map.delete("key");
`,
		`
const set = new Set([1, 2, 3]);
set.delete(1);
`,
	],
});
