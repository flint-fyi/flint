import rule from "./functionAssignments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function myFunction() {}
myFunction = function() {};
`,
			snapshot: `
function myFunction() {}
myFunction = function() {};
~~~~~~~~~~
Variables declared with function declarations should not be reassigned.
`,
		},
		{
			code: `
function myFunction() {}
myFunction = 123;
`,
			snapshot: `
function myFunction() {}
myFunction = 123;
~~~~~~~~~~
Variables declared with function declarations should not be reassigned.
`,
		},
		{
			code: `
function myFunction() {}
myFunction += 1;
`,
			snapshot: `
function myFunction() {}
myFunction += 1;
~~~~~~~~~~
Variables declared with function declarations should not be reassigned.
`,
		},
		{
			code: `
function myFunction() {}
myFunction++;
`,
			snapshot: `
function myFunction() {}
myFunction++;
~~~~~~~~~~
Variables declared with function declarations should not be reassigned.
`,
		},
		{
			code: `
function myFunction() {}
++myFunction;
`,
			snapshot: `
function myFunction() {}
++myFunction;
  ~~~~~~~~~~
  Variables declared with function declarations should not be reassigned.
`,
		},
		{
			code: `
function myFunction() {
    return 42;
}
myFunction = () => 100;
`,
			snapshot: `
function myFunction() {
    return 42;
}
myFunction = () => 100;
~~~~~~~~~~
Variables declared with function declarations should not be reassigned.
`,
		},
		{
			code: `
function outer() {
    function inner() {}
    inner = function() {};
}
`,
			snapshot: `
function outer() {
    function inner() {}
    inner = function() {};
    ~~~~~
    Variables declared with function declarations should not be reassigned.
}
`,
		},
		{
			code: `
function myFunction() {}
if (condition) {
    myFunction = null;
}
`,
			snapshot: `
function myFunction() {}
if (condition) {
    myFunction = null;
    ~~~~~~~~~~
    Variables declared with function declarations should not be reassigned.
}
`,
		},
		{
			code: `
function getValue() {
    return 1;
}
getValue ??= function() { return 0; };
`,
			snapshot: `
function getValue() {
    return 1;
}
getValue ??= function() { return 0; };
~~~~~~~~
Variables declared with function declarations should not be reassigned.
`,
		},
		{
			code: `
function getValue() {
    return true;
}
getValue &&= false;
`,
			snapshot: `
function getValue() {
    return true;
}
getValue &&= false;
~~~~~~~~
Variables declared with function declarations should not be reassigned.
`,
		},
		{
			code: `
function getValue() {
    return false;
}
getValue ||= () => true;
`,
			snapshot: `
function getValue() {
    return false;
}
getValue ||= () => true;
~~~~~~~~
Variables declared with function declarations should not be reassigned.
`,
		},
		{
			code: `
function calculate(value: number): number {
    return value * 2;
}
calculate = (value: number) => value * 3;
`,
			snapshot: `
function calculate(value: number): number {
    return value * 2;
}
calculate = (value: number) => value * 3;
~~~~~~~~~
Variables declared with function declarations should not be reassigned.
`,
		},
	],
	valid: [
		`function myFunction() { return 42; }`,
		`function myFunction() {} const result = myFunction();`,
		`const myFunction = function() {}; myFunction = () => {};`,
		`const myFunction = () => {}; myFunction = function() {};`,
		`let myFunction = function() {}; myFunction = () => {};`,
		`function outer() { const inner = function() {}; inner = () => {}; }`,
		`
function outer() {
    const myFunction = "shadowed variable";
    myFunction = "reassigning shadowed variable is ok";
}
`,
		`
let myFunction = "outer variable";
function scope() {
    function myFunction() {}
    console.log(myFunction);
}
myFunction = "reassigning outer is ok";
`,
		`function myFunction() {} const copy = myFunction;`,
		`function myFunction() {} if (condition) { callWith(myFunction); }`,
		`
function myFunction() {
    return function nested() {
        return 42;
    };
}
`,
	],
});
