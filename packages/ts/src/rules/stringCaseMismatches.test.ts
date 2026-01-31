import { ruleTester } from "./ruleTester.ts";
import rule from "./stringCaseMismatches.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
const result = str.toLowerCase() === "VALUE";
`,
			snapshot: `
const result = str.toLowerCase() === "VALUE";
                                     ~~~~~~~
                                     This \`toLowerCase()\` call is compared against a string that is not lowercase.
`,
		},
		{
			code: `
const result = str.toUpperCase() === "value";
`,
			snapshot: `
const result = str.toUpperCase() === "value";
                                     ~~~~~~~
                                     This \`toUpperCase()\` call is compared against a string that is not uppercase.
`,
		},
		{
			code: `
const result = "Mixed" === str.toLowerCase();
`,
			snapshot: `
const result = "Mixed" === str.toLowerCase();
               ~~~~~~~
               This \`toLowerCase()\` call is compared against a string that is not lowercase.
`,
		},
		{
			code: `
const result = str.toLowerCase() !== "HELLO";
`,
			snapshot: `
const result = str.toLowerCase() !== "HELLO";
                                     ~~~~~~~
                                     This \`toLowerCase()\` call is compared against a string that is not lowercase.
`,
		},
		{
			code: `
const result = str.toUpperCase() == "MixedCase";
`,
			snapshot: `
const result = str.toUpperCase() == "MixedCase";
                                    ~~~~~~~~~~~
                                    This \`toUpperCase()\` call is compared against a string that is not uppercase.
`,
		},
		{
			code: `
if (input.toLowerCase() === "YES") {
    doSomething();
}
`,
			snapshot: `
if (input.toLowerCase() === "YES") {
                            ~~~~~
                            This \`toLowerCase()\` call is compared against a string that is not lowercase.
    doSomething();
}
`,
		},
	],
	valid: [
		`const result = str.toLowerCase() === "value";`,
		`const result = str.toUpperCase() === "VALUE";`,
		`const result = str.toLowerCase() === other;`,
		`const result = str.toUpperCase() !== "HELLO";`,
		`const result = str.toLowerCase() === "";`,
		`const result = str.toLowerCase() === "123";`,
		`const result = str === "VALUE";`,
		`const result = str.trim() === "VALUE";`,
	],
});
