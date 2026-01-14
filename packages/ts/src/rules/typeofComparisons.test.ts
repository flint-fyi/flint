import { ruleTester } from "./ruleTester.ts";
import rule from "./typeofComparisons.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
if (typeof value === "") {
    process();
}
`,
			snapshot: `
if (typeof value === "") {
                     ~~
                     This string literal is not one that the typeof operator will ever produce.
    process();
}
`,
		},
		{
			code: `
if (typeof data != "invalid") {
    reject();
}
`,
			snapshot: `
if (typeof data != "invalid") {
                   ~~~~~~~~~
                   This string literal is not one that the typeof operator will ever produce.
    reject();
}
`,
		},
		{
			code: `
if ("invalid" === typeof flag) {
    toggle();
}
`,
			snapshot: `
if ("invalid" === typeof flag) {
    ~~~~~~~~~
    This string literal is not one that the typeof operator will ever produce.
    toggle();
}
`,
		},
		{
			code: `
if (typeof value === "String") {
    process();
}
`,
			snapshot: `
if (typeof value === "String") {
                     ~~~~~~~~
                     This string literal is not one that the typeof operator will ever produce.
    process();
}
`,
		},
		{
			code: `
const isValid = typeof input !== "array";
`,
			snapshot: `
const isValid = typeof input !== "array";
                                 ~~~~~~~
                                 This string literal is not one that the typeof operator will ever produce.
`,
		},
	],
	valid: [
		`if (typeof value === "string") { process(); }`,
		`if (typeof variable == "undefined") { handle(); }`,
		`if (typeof data != "number") { reject(); }`,
		`if (typeof callback !== "function") { throw new Error("Invalid callback"); }`,
		`if (typeof flag === "boolean") { toggle(); }`,
		`if (typeof value === "object") { parse(); }`,
		`if (typeof value === "symbol") { handle(); }`,
		`if (typeof value === "bigint") { compute(); }`,
		`if (typeof value === other) { process(); }`,
		`if (typeof value === typeof other) { compare(); }`,
		`const type = typeof value;`,
	],
});
