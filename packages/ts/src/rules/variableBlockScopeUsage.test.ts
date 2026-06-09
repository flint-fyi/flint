import { ruleTester } from "./ruleTester.ts";
import rule from "./variableBlockScopeUsage.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function test() {
    if (true) {
        var value = 1;
    }
    console.log(value);
}
`,
			snapshot: `
function test() {
    if (true) {
        var value = 1;
    }
    console.log(value);
                ~~~~~
                Variable 'value' is declared with var but used outside its block scope.
}
`,
		},
		{
			code: `
function test() {
    for (var index = 0; index < 10; index++) {
        doSomething();
    }
    console.log(index);
}
`,
			snapshot: `
function test() {
    for (var index = 0; index < 10; index++) {
        doSomething();
    }
    console.log(index);
                ~~~~~
                Variable 'index' is declared with var but used outside its block scope.
}
`,
		},
		{
			code: `
function test() {
    while (condition) {
        var result = calculate();
    }
    return result;
}
`,
			snapshot: `
function test() {
    while (condition) {
        var result = calculate();
    }
    return result;
           ~~~~~~
           Variable 'result' is declared with var but used outside its block scope.
}
`,
		},
		{
			code: `
function test() {
    {
        var nested = 1;
    }
    console.log(nested);
}
`,
			snapshot: `
function test() {
    {
        var nested = 1;
    }
    console.log(nested);
                ~~~~~~
                Variable 'nested' is declared with var but used outside its block scope.
}
`,
		},
		{
			code: `
function test() {
    if (condition) {
        var value = 1;
    }
    const getter = () => value;
}
`,
			snapshot: `
function test() {
    if (condition) {
        var value = 1;
    }
    const getter = () => value;
                         ~~~~~
                         Variable 'value' is declared with var but used outside its block scope.
}
`,
		},
	],
	valid: [
		`function test() { var value = 1; console.log(value); }`,
		`function test() { if (true) { var value = 1; console.log(value); } }`,
		`function test() { let value = 1; if (true) { console.log(value); } }`,
		`function test() { const value = 1; if (true) { console.log(value); } }`,
		`function test() { for (let index = 0; index < 10; index++) { doSomething(); } }`,
		`var globalValue = 1; function test() { console.log(globalValue); }`,
		`
function test() {
    for (var index = 0; index < 10; index++) {
        console.log(index);
    }
}
`,
		`
function test() {
    if (true) {
        var value = 1;
        console.log(value);
    }
}
`,
		`
function test() {
    switch (value) {
        case 1:
            var message = "one";
            console.log(message);
            break;
    }
}
`,
		`
function outer() {
    var value = 1;
    console.log(value);
}
`,
		`
function test() {
    if (condition) {
        var value = 1;
        var getter = function() { return value; };
        getter();
    }
}
`,
		`
function test(value) {
    switch (value) {
        case 1:
            var message = "one";
            break;
        default:
            message = "other";
    }
}
`,
	],
});
