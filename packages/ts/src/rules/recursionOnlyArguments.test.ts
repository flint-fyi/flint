import rule from "./recursionOnlyArguments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function test(onlyUsedInRecursion) {
    return test(onlyUsedInRecursion);
}
`,
			snapshot: `
function test(onlyUsedInRecursion) {
              ~~~~~~~~~~~~~~~~~~~
              This parameter is only used in recursive calls.
    return test(onlyUsedInRecursion);
}
`,
		},
		{
			code: `
function test(arg0, arg1) {
    return test("", arg1);
}
`,
			snapshot: `
function test(arg0, arg1) {
                    ~~~~
                    This parameter is only used in recursive calls.
    return test("", arg1);
}
`,
		},
		{
			code: `
function factorial(n, accumulator) {
    if (n <= 1) return 1;
    return factorial(n - 1, accumulator);
}
`,
			snapshot: `
function factorial(n, accumulator) {
                      ~~~~~~~~~~~
                      This parameter is only used in recursive calls.
    if (n <= 1) return 1;
    return factorial(n - 1, accumulator);
}
`,
		},
		{
			code: `
const recurse = (value) => {
    return recurse(value);
};
`,
			snapshot: `
const recurse = (value) => {
                 ~~~~~
                 This parameter is only used in recursive calls.
    return recurse(value);
};
`,
		},
		{
			code: `
const test = function test(arg) {
    return test(arg);
};
`,
			snapshot: `
const test = function test(arg) {
                           ~~~
                           This parameter is only used in recursive calls.
    return test(arg);
};
`,
		},
		{
			code: `
function multipleParams(used, unused1, unused2) {
    console.log(used);
    return multipleParams(used, unused1, unused2);
}
`,
			snapshot: `
function multipleParams(used, unused1, unused2) {
                              ~~~~~~~
                              This parameter is only used in recursive calls.
                                       ~~~~~~~
                                       This parameter is only used in recursive calls.
    console.log(used);
    return multipleParams(used, unused1, unused2);
}
`,
		},
		{
			code: `
function* generatorFunc(param) {
    yield generatorFunc(param);
}
`,
			snapshot: `
function* generatorFunc(param) {
                        ~~~~~
                        This parameter is only used in recursive calls.
    yield generatorFunc(param);
}
`,
		},
		{
			code: `
async function asyncFunc(param) {
    return await asyncFunc(param);
}
`,
			snapshot: `
async function asyncFunc(param) {
                         ~~~~~
                         This parameter is only used in recursive calls.
    return await asyncFunc(param);
}
`,
		},
		{
			code: `
class Example {
    method(param) {
        return this.method(param);
    }
}
`,
			snapshot: `
class Example {
    method(param) {
           ~~~~~
           This parameter is only used in recursive calls.
        return this.method(param);
    }
}
`,
		},
		{
			code: `
function conditionalRecursion(param) {
    if (Math.random() > 0.5) {
        return conditionalRecursion(param);
    }
    return conditionalRecursion(param);
}
`,
			snapshot: `
function conditionalRecursion(param) {
                              ~~~~~
                              This parameter is only used in recursive calls.
    if (Math.random() > 0.5) {
        return conditionalRecursion(param);
    }
    return conditionalRecursion(param);
}
`,
		},
	],
	valid: [
		`function test() { test(); }`,
		`function test(arg) { return arg; }`,
		`function test(arg) { console.log(arg); test(arg); }`,
		`function test(arg) { return arg + test(arg); }`,
		`function test(arg) { const result = arg * 2; return test(result); }`,
		`function test(arg0, arg1) { test(arg1, arg0); }`,
		`function test(arg) { anotherFunction(arg); }`,
		`function test(arg) { }`,
		`function test(arg0) { test(arg0 + 1); }`,
		`const test = (arg) => arg;`,
		`const test = (arg) => { console.log(arg); return test(arg); };`,
		`function outer(arg) { function inner() { return outer(arg); } return arg; }`,
		`function test(arg) { return () => test(arg); }`,
		`function test(a, b) { return test(a + b, b); }`,
		`
function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
`,
		`
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}
`,
		`
function traverse(node) {
    if (!node) return;
    console.log(node.value);
    traverse(node.left);
    traverse(node.right);
}
`,
		`
function helper(value) {
    if (value > 0) {
        return helper(value - 1);
    }
    return value;
}
`,
		`
class Example {
    method(param) {
        return param + this.method(param - 1);
    }
}
`,
		`
function test({ prop }) {
    return prop;
}
`,
		`
function test([first]) {
    return first;
}
`,
		`
function mutualA(n) {
    if (n <= 0) return 0;
    return mutualB(n - 1);
}
function mutualB(n) {
    return mutualA(n);
}
`,
	],
});
