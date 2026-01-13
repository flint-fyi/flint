import rule from "./charAtComparisons.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const text: string;
text.charAt(0) === "ab";
`,
			snapshot: `
declare const text: string;
text.charAt(0) === "ab";
~~~~~~~~~~~~~~~~~~~~~~~
Comparing charAt() result with a string of length 2 is always false.
`,
		},
		{
			code: `
declare const text: string;
"abc" === text.charAt(0);
`,
			snapshot: `
declare const text: string;
"abc" === text.charAt(0);
~~~~~~~~~~~~~~~~~~~~~~~~
Comparing charAt() result with a string of length 3 is always false.
`,
		},
		{
			code: `
declare const str: string;
declare const index: number;
str.charAt(index) == "hello";
`,
			snapshot: `
declare const str: string;
declare const index: number;
str.charAt(index) == "hello";
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Comparing charAt() result with a string of length 5 is always false.
`,
		},
		{
			code: `
declare const text: string;
text.charAt(0) !== "ab";
`,
			snapshot: `
declare const text: string;
text.charAt(0) !== "ab";
~~~~~~~~~~~~~~~~~~~~~~~
Comparing charAt() result with a string of length 2 is always true.
`,
		},
		{
			code: `
declare const text: string;
text.charAt(0) != "abc";
`,
			snapshot: `
declare const text: string;
text.charAt(0) != "abc";
~~~~~~~~~~~~~~~~~~~~~~~
Comparing charAt() result with a string of length 3 is always true.
`,
		},
		{
			code: `
declare const value: string;
declare function doSomething(): void;
if (value.charAt(5) === "test") {
    doSomething();
}
`,
			snapshot: `
declare const value: string;
declare function doSomething(): void;
if (value.charAt(5) === "test") {
    ~~~~~~~~~~~~~~~~~~~~~~~~~~
    Comparing charAt() result with a string of length 4 is always false.
    doSomething();
}
`,
		},
	],
	valid: [
		`declare const text: string; text.charAt(0) === "a";`,
		`declare const text: string; text.charAt(0) === "";`,
		`declare const text: string; "a" === text.charAt(0);`,
		`declare const text: string; text.charAt(0) !== "a";`,
		`declare const text: string; declare const variable: string; text.charAt(0) === variable;`,
		`declare const text: string; text.slice(0, 2) === 'ab';`,
		`declare const text: string; text.startsWith('ab');`,
		`declare const text: string; text.includes('ab');`,
		`declare const text: string; text[0] === 'a';`,
		// Userland charAt method should not trigger the rule
		`
const obj = {
	charAt(index: number) {
		return "hello";
	}
};
obj.charAt(0) === "ab";
`,
	],
});
