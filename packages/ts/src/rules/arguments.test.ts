import rule from "./arguments.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function sum() {
    return arguments[0] + arguments[1];
}
`,
			snapshot: `
function sum() {
    return arguments[0] + arguments[1];
           ~~~~~~~~~
           Use rest parameters instead of the \`arguments\` object.
                          ~~~~~~~~~
                          Use rest parameters instead of the \`arguments\` object.
}
`,
		},
		{
			code: `
function logAll() {
    void arguments;
}
`,
			snapshot: `
function logAll() {
    void arguments;
         ~~~~~~~~~
         Use rest parameters instead of the \`arguments\` object.
}
`,
		},
		{
			code: `
function getLength() {
    return arguments.length;
}
`,
			snapshot: `
function getLength() {
    return arguments.length;
           ~~~~~~~~~
           Use rest parameters instead of the \`arguments\` object.
}
`,
		},
		{
			code: `
const multiply = function() {
    return arguments[0];
};
`,
			snapshot: `
const multiply = function() {
    return arguments[0];
           ~~~~~~~~~
           Use rest parameters instead of the \`arguments\` object.
};
`,
		},
		{
			code: `
class Example {
    method() {
        return arguments[0];
    }
}
`,
			snapshot: `
class Example {
    method() {
        return arguments[0];
               ~~~~~~~~~
               Use rest parameters instead of the \`arguments\` object.
    }
}
`,
		},
		{
			code: `
class Example {
    get value() {
        return arguments[0];
    }
}
`,
			snapshot: `
class Example {
    get value() {
        return arguments[0];
               ~~~~~~~~~
               Use rest parameters instead of the \`arguments\` object.
    }
}
`,
		},
		{
			code: `
class Example {
    set value(input: number) {
        void input;
        void arguments[0];
    }
}
`,
			snapshot: `
class Example {
    set value(input: number) {
        void input;
        void arguments[0];
             ~~~~~~~~~
             Use rest parameters instead of the \`arguments\` object.
    }
}
`,
		},
		{
			code: `
class Example {
    constructor() {
        void arguments[0];
    }
}
`,
			snapshot: `
class Example {
    constructor() {
        void arguments[0];
             ~~~~~~~~~
             Use rest parameters instead of the \`arguments\` object.
    }
}
`,
		},
	],
	valid: [
		`function sum(...values: number[]) { return values.reduce((a, b) => a + b, 0); }`,
		`const logAll = (...items: unknown[]) => void items;`,
		`function getLength(...args: unknown[]) { return args.length; }`,
		`const obj = { arguments: 1 }; void obj.arguments;`,
		`const arrow = () => { const args = [1, 2, 3]; return args; };`,
		`class Example { arguments = 5; method() { return this.arguments; } }`,
		`
function outer() {
    const arrow = () => arguments;
    return arrow;
}
`,
		`
function outer() {
    const nested = () => {
        const inner = () => arguments;
        return inner;
    };
    return nested;
}
`,
		`function outer() { const arrow = () => arguments; }`,
		`function outer() { const obj = { arguments }; return obj; }`,
	],
});
