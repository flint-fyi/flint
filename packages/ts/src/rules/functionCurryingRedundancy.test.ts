import rule from "./functionCurryingRedundancy.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function add(a, b) {
    return a + b;
}
const result = add.call(undefined, 1, 2);
`,
			output: `
function add(a, b) {
    return a + b;
}
const result = add(1, 2);
`,
			snapshot: `
function add(a, b) {
    return a + b;
}
const result = add.call(undefined, 1, 2);
                  ~~~~~~~~~~~~~~~~~~~~~~
                  This "currying" of a function without a defined context does nothing and can be simplified.
`,
		},
		{
			code: `
function add(a, b) {
    return a + b;
}
const result = add.call(null, 1, 2);
`,
			output: `
function add(a, b) {
    return a + b;
}
const result = add(1, 2);
`,
			snapshot: `
function add(a, b) {
    return a + b;
}
const result = add.call(null, 1, 2);
                  ~~~~~~~~~~~~~~~~~
                  This "currying" of a function without a defined context does nothing and can be simplified.
`,
		},
		{
			code: `
function add(a, b) {
    return a + b;
}
const result = add.apply(undefined, [1, 2]);
`,
			output: `
function add(a, b) {
    return a + b;
}
const result = add(...[1, 2]);
`,
			snapshot: `
function add(a, b) {
    return a + b;
}
const result = add.apply(undefined, [1, 2]);
                  ~~~~~~~~~~~~~~~~~~~~~~~~~
                  This "currying" of a function without a defined context does nothing and can be simplified.
`,
		},
		{
			code: `
function add(a, b) {
    return a + b;
}
const result = add.apply(null, [1, 2]);
`,
			output: `
function add(a, b) {
    return a + b;
}
const result = add(...[1, 2]);
`,
			snapshot: `
function add(a, b) {
    return a + b;
}
const result = add.apply(null, [1, 2]);
                  ~~~~~~~~~~~~~~~~~~~~
                  This "currying" of a function without a defined context does nothing and can be simplified.
`,
		},
		{
			code: `
const fn = (x: number) => x * 2;
const value = fn.call(undefined, 5);
`,
			output: `
const fn = (x: number) => x * 2;
const value = fn(5);
`,
			snapshot: `
const fn = (x: number) => x * 2;
const value = fn.call(undefined, 5);
                ~~~~~~~~~~~~~~~~~~~
                This "currying" of a function without a defined context does nothing and can be simplified.
`,
		},
		{
			code: `
const callback = function(name: string) {
    return name.toUpperCase();
};
callback.apply(null, ["test"]);
`,
			output: `
const callback = function(name: string) {
    return name.toUpperCase();
};
callback(...["test"]);
`,
			snapshot: `
const callback = function(name: string) {
    return name.toUpperCase();
};
callback.apply(null, ["test"]);
        ~~~~~~~~~~~~~~~~~~~~~~
        This "currying" of a function without a defined context does nothing and can be simplified.
`,
		},
	],
	valid: [
		`function add(a, b) { return a + b; } const result = add(1, 2);`,
		`const obj = { value: 10, getValue: function() { return this.value; } }; obj.getValue();`,
		`const obj = { value: 10 }; function getValue() { return this.value; } const result = getValue.call(obj);`,
		`const obj1 = { method: function() { return 42; } }; const obj2 = {}; obj1.method.call(obj2);`,
		`
function greet() {
    return this.name;
}
const person = { name: "Alice" };
const result = greet.call(person);
`,
		`
const obj = {
    value: 42,
    getValue: function() {
        return this.value;
    }
};
const result = obj.getValue.call(obj);
`,
		// Test case for the bug: interface with apply/call methods that aren't from Function.prototype
		`
interface CustomInterface {
    apply(...args: unknown[]): void;
}

declare const customObj: CustomInterface;
customObj.apply(null, "abc");
`,
		`
interface CustomInterface {
    call(...args: unknown[]): void;
}

declare const customObj: CustomInterface;
customObj.call(null, "abc");
`,
	],
});
