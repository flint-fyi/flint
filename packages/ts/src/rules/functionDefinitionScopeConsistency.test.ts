import rule from "./functionDefinitionScopeConsistency.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function outer(value: string) {
    function inner(text: string) {
        return text === "test";
    }
    return inner;
}
`,
			snapshot: `
function outer(value: string) {
    function inner(text: string) {
    ~~~~~~~~
    Function does not capture any variables from the enclosing scope and can be moved to the outer scope.
        return text === "test";
    }
    return inner;
}
`,
		},
		{
			code: `
function outer(value: string) {
    const inner = (text: string) => {
        return text === "test";
    };
    return inner;
}
`,
			snapshot: `
function outer(value: string) {
    const inner = (text: string) => {
                  ~
                  Function does not capture any variables from the enclosing scope and can be moved to the outer scope.
        return text === "test";
    };
    return inner;
}
`,
		},
		{
			code: `
function outer() {
    return (dispatch: Function) => dispatch({ type: "ACTION" });
}
`,
			snapshot: `
function outer() {
    return (dispatch: Function) => dispatch({ type: "ACTION" });
           ~
           Function does not capture any variables from the enclosing scope and can be moved to the outer scope.
}
`,
		},
		{
			code: `
const outer = () => {
    function helper(value: number) {
        return value * 2;
    }
    return helper;
};
`,
			snapshot: `
const outer = () => {
    function helper(value: number) {
    ~~~~~~~~
    Function does not capture any variables from the enclosing scope and can be moved to the outer scope.
        return value * 2;
    }
    return helper;
};
`,
		},
	],
	valid: [
		`function doBar(value: string) { return value === "bar"; }`,
		`const doBar = (value: string) => value === "bar";`,
		`
function outer(value: string) {
    function inner() {
        return value === "test";
    }
    return inner;
}
`,
		`
function outer(multiplier: number) {
    const inner = (value: number) => value * multiplier;
    return inner;
}
`,
		`
function outer() {
    return function inner() {
        return this;
    };
}
`,
		`
class Example {
    method() {
        const handler = () => {
            return this.value;
        };
        return handler;
    }
    value = 1;
}
`,
		`
function outer() {
    const data = "test";
    function inner() {
        return data;
    }
    return inner;
}
`,
		`
function outer(data: string) {
    function helper() { return data; }
    function inner() {
        return helper();
    }
    return inner;
}
`,
	],
});
