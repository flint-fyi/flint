import { ruleTester } from "./ruleTester.ts";
import rule from "./stringCaseMismatches.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const str: string;
const result = str.toLowerCase() === "VALUE";
`,
			snapshot: `
declare const str: string;
const result = str.toLowerCase() === "VALUE";
                                     ~~~~~~~
                                     This \`toLowerCase()\` call is compared against a string that is not lowercase.
`,
		},
		{
			code: `
declare const str: string;
const result = str.toUpperCase() === "value";
`,
			snapshot: `
declare const str: string;
const result = str.toUpperCase() === "value";
                                     ~~~~~~~
                                     This \`toUpperCase()\` call is compared against a string that is not uppercase.
`,
		},
		{
			code: `
declare const str: string;
const result = "Mixed" === str.toLowerCase();
`,
			snapshot: `
declare const str: string;
const result = "Mixed" === str.toLowerCase();
               ~~~~~~~
               This \`toLowerCase()\` call is compared against a string that is not lowercase.
`,
		},
		{
			code: `
declare const str: string;
const result = str.toLowerCase() !== "HELLO";
`,
			snapshot: `
declare const str: string;
const result = str.toLowerCase() !== "HELLO";
                                     ~~~~~~~
                                     This \`toLowerCase()\` call is compared against a string that is not lowercase.
`,
		},
		{
			code: `
declare const str: string;
const result = str.toUpperCase() == "MixedCase";
`,
			snapshot: `
declare const str: string;
const result = str.toUpperCase() == "MixedCase";
                                    ~~~~~~~~~~~
                                    This \`toUpperCase()\` call is compared against a string that is not uppercase.
`,
		},
		{
			code: `
declare const input: string;
declare function doSomething(): void;
if (input.toLowerCase() === "YES") {
    doSomething();
}
`,
			snapshot: `
declare const input: string;
declare function doSomething(): void;
if (input.toLowerCase() === "YES") {
                            ~~~~~
                            This \`toLowerCase()\` call is compared against a string that is not lowercase.
    doSomething();
}
`,
		},
	],
	valid: [
		`
declare const str: string;
const result = str.toLowerCase() === "value";
`,
		`
declare const str: string;
const result = str.toUpperCase() === "VALUE";
`,
		`
declare const str: string;
declare const other: string;
const result = str.toLowerCase() === other;
`,
		`
declare const str: string;
const result = str.toUpperCase() !== "HELLO";
`,
		`
declare const str: string;
const result = str.toLowerCase() === "";
`,
		`
declare const str: string;
const result = str.toLowerCase() === "123";
`,
		`
declare const str: string;
const result = str === "VALUE";
`,
		`
declare const str: string;
const result = str.trim() === "VALUE";
`,
	],
});
