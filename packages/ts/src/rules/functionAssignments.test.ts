import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import rule from "./functionAssignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function myFunction() {}
myFunction = function() {};
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
				noUnusedLocals: false,
			}),
			snapshot: `
function myFunction() {}
myFunction = function() {};
~~~~~~~~~~
Variables declared with function declarations should not be reassigned.
`,
		},
	],
	valid: [
		`function myFunction() { return 42; } void myFunction;`,
		`
function myFunction() {}
const result = myFunction();
void result;
`,
		`
let myFunction = function() {};
myFunction = () => {};
myFunction();
`,
		`
let myFunction = () => {};
myFunction = function() {};
myFunction();
`,
		`
let myFunction = function() {};
myFunction = () => {};
myFunction();
`,
		`
function outer() {
    let inner = function() {};
    inner = () => {};
    inner();
}
outer();
`,
		`
function outer() {
    let myFunction = "shadowed variable";
    myFunction = "reassigning shadowed variable is ok";
    myFunction;
}
outer();
`,
		`
let myFunction = "outer variable";
function scope() {
    function myFunction() {}
    myFunction;
}
scope();
myFunction = "reassigning outer is ok";
myFunction;
`,
		`
function myFunction() {}
const copy = myFunction;
void copy;
`,
		`
declare const condition: boolean;
declare function callWith(callback: () => void): void;
function myFunction() {}
if (condition) {
    callWith(myFunction);
}
`,
		`
function myFunction() {
    return function nested() {
        return 42;
    };
}
void myFunction;
`,
	],
});
