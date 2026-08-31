import rule from "./emptyBlocks.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const condition: boolean;

if (condition) {}
`,
			snapshot: `
declare const condition: boolean;

if (condition) {}
               ~~
               Empty block statements should be removed or contain code.
`,
		},
		{
			code: `
declare const condition: boolean;

if (condition) {
} else {}
`,
			snapshot: `
declare const condition: boolean;

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
declare const condition: boolean;

while (condition) {}
`,
			snapshot: `
declare const condition: boolean;

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
declare const value: number;

switch (value) {}
`,
			snapshot: `
declare const value: number;

switch (value) {}
               ~~
               Empty block statements should be removed or contain code.
`,
		},
		{
			code: `
declare const condition: boolean;

do {} while (condition);
`,
			snapshot: `
declare const condition: boolean;

do {} while (condition);
   ~~
   Empty block statements should be removed or contain code.
`,
		},
		{
			code: `
declare const x: boolean;
declare const y: boolean;
declare function doSomething(): void;

if (x) {
    doSomething();
} else if (y) {}
`,
			snapshot: `
declare const x: boolean;
declare const y: boolean;
declare function doSomething(): void;

if (x) {
    doSomething();
} else if (y) {}
              ~~
              Empty block statements should be removed or contain code.
`,
		},
		{
			code: `
declare function doSomething(): void;

try {
    doSomething();
} finally {}
`,
			snapshot: `
declare function doSomething(): void;

try {
    doSomething();
} finally {}
          ~~
          Empty block statements should be removed or contain code.
`,
		},
	],
	valid: [
		`
declare const condition: boolean;
declare function doSomething(): void;

if (condition) { doSomething(); }
`,
		`
declare const condition: boolean;
declare function doSomething(): void;

while (condition) { doSomething(); }
`,
		`
declare function doSomething(): void;

for (let i = 0; i < 10; i++) { doSomething(); }
`,
		`
declare const value: number;

switch (value) { case 1: break; }
`,
		`
declare const condition: boolean;
declare function doSomething(): void;

do { doSomething(); } while (condition);
`,
		`function test() {}`,
		`const fn = function() {};`,
		`const arrow = () => {};`,
		`class MyClass { method() {} }`,
		`class MyClass { constructor() {} }`,
		`class MyClass { set value(value: number) {} }`,
		`
declare const condition: boolean;

if (condition) {
    // Intentionally empty
}
`,
		`
declare const condition: boolean;

while (condition) {
    /* Do nothing */
}
`,
		`
declare function doSomething(): void;

try {
    doSomething();
} catch (error) {}
`,
		`
declare function doSomething(): void;

try {
    doSomething();
} catch (error) {
    // Ignore errors
}
`,
	],
});
