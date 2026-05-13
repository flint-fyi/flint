import rule from "./loopFunctions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
for (let i = 0; i < 10; i++) {
    const fn = function() { return i; };
}
`,
			snapshot: `
for (let i = 0; i < 10; i++) {
    const fn = function() { return i; };
               ~~~~~~~~
               Functions created inside loops can cause unexpected behavior when referencing variables modified by the loop.
}
`,
		},
		{
			code: `
for (let i = 0; i < 10; i++) {
    const fn = () => i;
}
`,
			snapshot: `
for (let i = 0; i < 10; i++) {
    const fn = () => i;
               ~
               Functions created inside loops can cause unexpected behavior when referencing variables modified by the loop.
}
`,
		},
		{
			code: `
for (let i = 0; i < 10; i++) {
    function createHandler() { return i; }
}
`,
			snapshot: `
for (let i = 0; i < 10; i++) {
    function createHandler() { return i; }
    ~~~~~~~~
    Functions created inside loops can cause unexpected behavior when referencing variables modified by the loop.
}
`,
		},
		{
			code: `
const items = [1, 2, 3];
for (const item of items) {
    const handler = () => item;
}
`,
			snapshot: `
const items = [1, 2, 3];
for (const item of items) {
    const handler = () => item;
                    ~
                    Functions created inside loops can cause unexpected behavior when referencing variables modified by the loop.
}
`,
		},
		{
			code: `
for (let i = 0; i < 10; i++) {
    setTimeout(function() { console.log(i); }, 100);
}
`,
			snapshot: `
for (let i = 0; i < 10; i++) {
    setTimeout(function() { console.log(i); }, 100);
               ~~~~~~~~
               Functions created inside loops can cause unexpected behavior when referencing variables modified by the loop.
}
`,
		},
		{
			code: `
for (let i = 0; i < 10; i++) {
    if (condition) {
        const fn = () => i;
    }
}
`,
			snapshot: `
for (let i = 0; i < 10; i++) {
    if (condition) {
        const fn = () => i;
                   ~
                   Functions created inside loops can cause unexpected behavior when referencing variables modified by the loop.
    }
}
`,
		},
		{
			code: `
const object = { a: 1, b: 2 };
for (const key in object) {
    const getter = () => key;
}
`,
			snapshot: `
const object = { a: 1, b: 2 };
for (const key in object) {
    const getter = () => key;
                   ~
                   Functions created inside loops can cause unexpected behavior when referencing variables modified by the loop.
}
`,
		},
		{
			code: `
for (let i = 0; i < 10; i++) {
    const fn = () => {
        for (let j = 0; j < 5; j++) {
            const innerFn = () => j;
        }
    };
}
`,
			snapshot: `
for (let i = 0; i < 10; i++) {
    const fn = () => {
        for (let j = 0; j < 5; j++) {
            const innerFn = () => j;
                            ~
                            Functions created inside loops can cause unexpected behavior when referencing variables modified by the loop.
        }
    };
}
`,
		},
	],
	valid: [
		`
for (let i = 0; i < 10; i++) {
    const fn = function() { return 42; };
}
`,
		`
for (let i = 0; i < 10; i++) {
    const fn = () => 42;
}
`,
		`
for (let i = 0; i < 10; i++) {
    const j = i;
    const fn = function() { return j; };
}
`,
		`
function outer() {
    const fn = function() { return i; };
}
for (let i = 0; i < 10; i++) {
    outer();
}
`,
		`
for (let i = 0; i < 10; i++) {
    const fn = (function(value) {
        return function() { return value; };
    })(i);
}
`,
		`
for (let i = 0; i < 10; i++) {
    const fn = () => {
        const j = 0;
        const innerFn = () => j;
    };
}
`,
		`
let i = 0;
while (i < 10) {
    const fn = () => 42;
    i++;
}
`,
		`
let i = 0;
do {
    const fn = () => 42;
    i++;
} while (i < 10);
`,
		`
const items = [1, 2, 3];
for (const item of items) {
    const value = item;
    const handler = () => value;
}
`,
	],
});
