import rule from "./generatorFunctionYields.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
function* emptyGenerator() {
    console.log("No yield here");
}
`,
			snapshot: `
function* emptyGenerator() {
        ~
        Generator functions must contain at least one yield expression to produce values.
    console.log("No yield here");
}
`,
		},
		{
			code: `
const generator = function* () {
    return 42;
};
`,
			snapshot: `
const generator = function* () {
                          ~
                          Generator functions must contain at least one yield expression to produce values.
    return 42;
};
`,
		},
		{
			code: `
class MyClass {
    *generatorMethod() {
        this.doSomething();
    }
}
`,
			snapshot: `
class MyClass {
    *generatorMethod() {
    ~
    Generator functions must contain at least one yield expression to produce values.
        this.doSomething();
    }
}
`,
		},
		{
			code: `
function* generatorWithNestedFunction() {
    function inner() {
        yield 42;
    }
}
`,
			snapshot: `
function* generatorWithNestedFunction() {
        ~
        Generator functions must contain at least one yield expression to produce values.
    function inner() {
        yield 42;
    }
}
`,
		},
		{
			code: `
function* generatorWithNestedGeneratorFunction() {
    function* inner() {
        yield 42;
    }
}
`,
			snapshot: `
function* generatorWithNestedGeneratorFunction() {
        ~
        Generator functions must contain at least one yield expression to produce values.
    function* inner() {
        yield 42;
    }
}
`,
		},
	],
	valid: [
		`
function* validGenerator() {
    yield 1;
}
`,
		`
function* validGeneratorMultiple() {
    yield 1;
    yield 2;
    yield 3;
}
`,
		`
const generator = function* () {
    yield 42;
};
`,
		`
class MyClass {
    *generatorMethod() {
        yield this.value;
    }
}
`,
		`
function* conditionalYield(condition: boolean) {
    if (condition) {
        yield 1;
    }
}
`,
		`
function* yieldInLoop() {
    for (let i = 0; i < 10; i++) {
        yield i;
    }
}
`,
		`
function* yieldDelegate() {
    yield* [1, 2, 3];
}
`,
		`
function regularFunction() {
    return 42;
}
`,
		`
const arrow = () => {
    return 42;
};
`,
		`
function* generatorWithNestedGenerator() {
    yield 1;
    function* inner() {
        yield 2;
    }
}
`,
	],
});
