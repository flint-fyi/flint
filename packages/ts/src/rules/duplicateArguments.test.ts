import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import rule from "./duplicateArguments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function test(value, value) {
    return value;
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
function test(value, value) {
                     ~~~~~
                     This parameter overrides the previous parameter of the same name.
    return value;
}
`,
		},
		{
			code: `
function test(first, second, first) {
    return first + second;
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
function test(first, second, first) {
                             ~~~~~
                             This parameter overrides the previous parameter of the same name.
    return first + second;
}
`,
		},
		{
			code: `
const func = function (value, value) {
    return value;
};
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
const func = function (value, value) {
                              ~~~~~
                              This parameter overrides the previous parameter of the same name.
    return value;
};
`,
		},
		{
			code: `
function test(first, second, third, second) {
    return first + second + third;
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
function test(first, second, third, second) {
                                    ~~~~~~
                                    This parameter overrides the previous parameter of the same name.
    return first + second + third;
}
`,
		},
		{
			code: `
function test(value, value, value) {
    return value;
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
			}),
			snapshot: `
function test(value, value, value) {
                     ~~~~~
                     This parameter overrides the previous parameter of the same name.
                            ~~~~~
                            This parameter overrides the previous parameter of the same name.
    return value;
}
`,
		},
	],
	valid: [
		`function test(value: number) { return value; } void test;`,
		`function test(first: number, second: number) { return first + second; } void test;`,
		`const arrow = (value: number) => value; void arrow;`,
		`const arrow = (first: number, second: number) => first + second; void arrow;`,
		`const func = function (value: number) { return value; }; void func;`,
		`const func = function (first: number, second: number) { return first + second; }; void func;`,
		`class Example { method(value: number) { return value; } } void Example;`,
		`class Example { method(first: number, second: number) { return first + second; } } void Example;`,
		`class Example { value!: number; constructor(value: number) { this.value = value; } } void Example;`,
		`class Example { first!: number; second!: number; constructor(first: number, second: number) { this.first = first; this.second = second; } } void Example;`,
		`function test({ value }: { value: number }) { return value; } void test;`,
		`function test({ first, second }: { first: number; second: number }) { return first + second; } void test;`,
		`function test([first, second]: [number, number]) { return first + second; } void test;`,
	],
});
