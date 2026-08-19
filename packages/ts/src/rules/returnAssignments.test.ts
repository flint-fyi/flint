import rule from "./returnAssignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function getValue() {
    let value;
    return value = 1;
}
`,
			snapshot: `
function getValue() {
    let value;
    return value = 1;
                 ~
                 Placing an assignment inside a return statement can be misleading and is often a sign of a logical mistake.
}
`,
		},
		{
			code: `
declare function calculate(): number;

function process() {
    let result;
    return result = calculate();
}
`,
			snapshot: `
declare function calculate(): number;

function process() {
    let result;
    return result = calculate();
                  ~
                  Placing an assignment inside a return statement can be misleading and is often a sign of a logical mistake.
}
`,
		},
		{
			code: `
function update() {
    let status;
    return (status = "updated");
}
`,
			snapshot: `
function update() {
    let status;
    return (status = "updated");
                   ~
                   Placing an assignment inside a return statement can be misleading and is often a sign of a logical mistake.
}
`,
		},
		{
			code: `
const arrow = () => {
    let value;
    return value = 42;
};
`,
			snapshot: `
const arrow = () => {
    let value;
    return value = 42;
                 ~
                 Placing an assignment inside a return statement can be misleading and is often a sign of a logical mistake.
};
`,
		},
		{
			code: `
let value = 0;

const arrowImplicit = () => (value = 100);
`,
			snapshot: `
let value = 0;

const arrowImplicit = () => (value = 100);
                                   ~
                                   Placing an assignment inside a return statement can be misleading and is often a sign of a logical mistake.
`,
		},
		{
			code: `
function multiply(factor: number) {
    let result;
    return result = factor * 2;
}
`,
			snapshot: `
function multiply(factor: number) {
    let result;
    return result = factor * 2;
                  ~
                  Placing an assignment inside a return statement can be misleading and is often a sign of a logical mistake.
}
`,
		},
		{
			code: `
function compound() {
    let count = 0;
    return count += 5;
}
`,
			snapshot: `
function compound() {
    let count = 0;
    return count += 5;
                 ~~
                 Placing an assignment inside a return statement can be misleading and is often a sign of a logical mistake.
}
`,
		},
		{
			code: `
function bitwise() {
    let flags = 0;
    return flags |= 0x01;
}
`,
			snapshot: `
function bitwise() {
    let flags = 0;
    return flags |= 0x01;
                 ~~
                 Placing an assignment inside a return statement can be misleading and is often a sign of a logical mistake.
}
`,
		},
	],
	valid: [
		`function getValue() { return 1; }`,
		`function getValue() { let value = 1; return value; }`,
		`
declare function calculate(): number;

function process() {
    const result = calculate();
    return result;
}
`,
		`const arrow = () => { let value = 42; return value; };`,
		`
declare function getValue(): number;

const arrowImplicit = () => getValue();
`,
		`
function update() {
    let status = "updated";
    return status;
}
`,
		`
function multiply(factor: number) {
    let result = factor * 2;
    return result;
}
`,
		`
function compound() {
    let count = 0;
    count += 5;
    return count;
}
`,
		`
function calculate() {
    const value = 10;
    return value;
}
`,
		`
const process = (input: number) => {
    const result = input * 2;
    return result;
};
`,
		`
class MyClass {
    method() {
        const value = 42;
        return value;
    }
}
`,
		`
function compare(a: number, b: number) {
    return a === b;
}
`,
		`
function arrowReturn() {
    const fn = () => 42;
    return fn;
}
`,
	],
});
