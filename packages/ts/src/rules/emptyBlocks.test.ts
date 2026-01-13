import rule from "./emptyBlocks.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
if (condition) {}
`,
			snapshot: `
if (condition) {}
               ~~
               Empty block statements should be removed or contain code.
`,
		},
		{
			code: `
if (condition) {
} else {}
`,
			snapshot: `
if (condition) {
               ~
               Empty block statements should be removed or contain code.
} else {}
~
       ~~
       Empty block statements should be removed or contain code.
`,
		},
		{
			code: `
while (condition) {}
`,
			snapshot: `
while (condition) {}
                  ~~
                  Empty block statements should be removed or contain code.
`,
		},
		{
			code: `
for (let i = 0; i < 10; i++) {}
`,
			snapshot: `
for (let i = 0; i < 10; i++) {}
                             ~~
                             Empty block statements should be removed or contain code.
`,
		},
		{
			code: `
switch (value) {}
`,
			snapshot: `
switch (value) {}
               ~~
               Empty block statements should be removed or contain code.
`,
		},
		{
			code: `
do {} while (condition);
`,
			snapshot: `
do {} while (condition);
   ~~
   Empty block statements should be removed or contain code.
`,
		},
		{
			code: `
if (x) {
    doSomething();
} else if (y) {}
`,
			snapshot: `
if (x) {
    doSomething();
} else if (y) {}
              ~~
              Empty block statements should be removed or contain code.
`,
		},
		{
			code: `
try {
    doSomething();
} finally {}
`,
			snapshot: `
try {
    doSomething();
} finally {}
          ~~
          Empty block statements should be removed or contain code.
`,
		},
	],
	valid: [
		`if (condition) { doSomething(); }`,
		`while (condition) { doSomething(); }`,
		`for (let i = 0; i < 10; i++) { doSomething(); }`,
		`switch (value) { case 1: break; }`,
		`do { doSomething(); } while (condition);`,
		`function test() {}`,
		`const fn = function() {};`,
		`const arrow = () => {};`,
		`class MyClass { method() {} }`,
		`class MyClass { constructor() {} }`,
		`class MyClass { get value() {} }`,
		`class MyClass { set value(v) {} }`,
		`
if (condition) {
    // Intentionally empty
}
`,
		`
while (condition) {
    /* Do nothing */
}
`,
		`
try {
    doSomething();
} catch (error) {}
`,
		`
try {
    doSomething();
} catch (error) {
    // Ignore errors
}
`,
	],
});
