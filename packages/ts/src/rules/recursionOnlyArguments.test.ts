import rule from "./recursionOnlyArguments.ts";
import { domLibRuleTester } from "./ruleTester.ts";

domLibRuleTester.describe(rule, {
	invalid: [
		{
			code: `
function f(arg: number) {
    f(arg);
    {
        let arg = 2;
        console.log(arg);
    }
}
`,
			snapshot: `
function f(arg: number) {
           ~~~
           This parameter is only used in recursive calls.
    f(arg);
    {
        let arg = 2;
        console.log(arg);
    }
}
`,
		},
		{
			code: `
function test(onlyUsedInRecursion: number) {
    return test(onlyUsedInRecursion);
}
`,
			snapshot: `
function test(onlyUsedInRecursion: number) {
              ~~~~~~~~~~~~~~~~~~~
              This parameter is only used in recursive calls.
    return test(onlyUsedInRecursion);
}
`,
		},
		{
			code: `
function test(arg0: string, arg1: string) {
    return test("", arg1);
}
`,
			snapshot: `
function test(arg0: string, arg1: string) {
                            ~~~~
                            This parameter is only used in recursive calls.
    return test("", arg1);
}
`,
		},
		{
			code: `
function factorial(n: number, accumulator: number) {
    if (n <= 1) return 1;
    return factorial(n - 1, accumulator);
}
`,
			snapshot: `
function factorial(n: number, accumulator: number) {
                              ~~~~~~~~~~~
                              This parameter is only used in recursive calls.
    if (n <= 1) return 1;
    return factorial(n - 1, accumulator);
}
`,
		},
		{
			code: `
const recurse = (value: number): unknown => {
    return recurse(value);
};
`,
			snapshot: `
const recurse = (value: number): unknown => {
                 ~~~~~
                 This parameter is only used in recursive calls.
    return recurse(value);
};
`,
		},
		{
			code: `
const test = function test(arg: number) {
    return test(arg);
};
`,
			snapshot: `
const test = function test(arg: number) {
                           ~~~
                           This parameter is only used in recursive calls.
    return test(arg);
};
`,
		},
		{
			code: `
function multipleParams(used: number, unused1: number, unused2: number) {
    console.log(used);
    return multipleParams(used, unused1, unused2);
}
`,
			snapshot: `
function multipleParams(used: number, unused1: number, unused2: number) {
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
function* generatorFunc(param: number): Generator<unknown> {
    yield generatorFunc(param);
}
`,
			snapshot: `
function* generatorFunc(param: number): Generator<unknown> {
                        ~~~~~
                        This parameter is only used in recursive calls.
    yield generatorFunc(param);
}
`,
		},
		{
			code: `
async function asyncFunc(param: number): Promise<unknown> {
    return await asyncFunc(param);
}
`,
			snapshot: `
async function asyncFunc(param: number): Promise<unknown> {
                         ~~~~~
                         This parameter is only used in recursive calls.
    return await asyncFunc(param);
}
`,
		},
		{
			code: `
class Example {
    method(param: number): unknown {
        return this.method(param);
    }
}
`,
			snapshot: `
class Example {
    method(param: number): unknown {
           ~~~~~
           This parameter is only used in recursive calls.
        return this.method(param);
    }
}
`,
		},
		{
			code: `
function conditionalRecursion(param: number): unknown {
    if (Math.random() > 0.5) {
        return conditionalRecursion(param);
    }
    return conditionalRecursion(param);
}
`,
			snapshot: `
function conditionalRecursion(param: number): unknown {
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
		`function test(arg: number) { return arg; }`,
		`function test(arg: number) { console.log(arg); test(arg); }`,
		`function test(arg: number): number { return arg + test(arg); }`,
		`function test(arg: number) { const result = arg * 2; return test(result); }`,
		`function test(arg0: string, arg1: string) { test(arg1, arg0); }`,
		`
declare function anotherFunction(value: number): void;
function test(arg: number) { anotherFunction(arg); }
`,
		`function test(arg: number) { }`,
		`function test(arg0: number) { test(arg0 + 1); }`,
		`const test = (arg: number) => arg;`,
		`const test = (arg: number): unknown => { console.log(arg); return test(arg); };`,
		`function outer(arg: number) { function inner() { return outer(arg); } return arg; }`,
		`function test(arg: number) { return () => test(arg); }`,
		`function test(a: number, b: number) { return test(a + b, b); }`,
		`
function factorial(n: number): number {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
`,
		`
function fibonacci(n: number): number {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}
`,
		`
interface TreeNode {
    left?: TreeNode;
    right?: TreeNode;
    value: number;
}

function traverse(node: TreeNode | undefined) {
    if (!node) return;
    console.log(node.value);
    traverse(node.left);
    traverse(node.right);
}
`,
		`
function helper(value: number): number {
    if (value > 0) {
        return helper(value - 1);
    }
    return value;
}
`,
		`
class Example {
    method(param: number): number {
        return param + this.method(param - 1);
    }
}
`,
		`
function test({ prop }: { prop: number }) {
    return prop;
}
`,
		`
function test([first]: number[]) {
    return first;
}
`,
		`
function mutualA(n: number): number {
    if (n <= 0) return 0;
    return mutualB(n - 1);
}
function mutualB(n: number): number {
    return mutualA(n);
}
`,
	],
});
