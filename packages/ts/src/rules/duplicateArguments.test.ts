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
const arrow = (value, value) => value;
`,
			snapshot: `
const arrow = (value, value) => value;
                      ~~~~~
                      This parameter overrides the previous parameter of the same name.
`,
		},
		{
			code: `
const func = function (value, value) {
    return value;
};
`,
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
class Example {
    method(value, value) {
        return value;
    }
}
`,
			snapshot: `
class Example {
    method(value, value) {
                  ~~~~~
                  This parameter overrides the previous parameter of the same name.
        return value;
    }
}
`,
		},
		{
			code: `
class Example {
    constructor(value, value) {
        this.value = value;
    }
}
`,
			snapshot: `
class Example {
    constructor(value, value) {
                       ~~~~~
                       This parameter overrides the previous parameter of the same name.
        this.value = value;
    }
}
`,
		},
		{
			code: `
function test(first, second, third, second) {
    return first + second + third;
}
`,
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
		`function test(value) { return value; }`,
		`function test(first, second) { return first + second; }`,
		`const arrow = (value) => value;`,
		`const arrow = (first, second) => first + second;`,
		`const func = function (value) { return value; };`,
		`const func = function (first, second) { return first + second; };`,
		`class Example { method(value) { return value; } }`,
		`class Example { method(first, second) { return first + second; } }`,
		`class Example { constructor(value) { this.value = value; } }`,
		`class Example { constructor(first, second) { this.first = first; this.second = second; } }`,
		`function test({ value }) { return value; }`,
		`function test({ first, second }) { return first + second; }`,
		`function test([first, second]) { return first + second; }`,
	],
});
