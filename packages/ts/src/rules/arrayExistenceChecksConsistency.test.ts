import rule from "./arrayExistenceChecksConsistency.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const values: string[];
if (values.indexOf("test") < 0) {}
`,
			output: `
declare const values: string[];
if (values.indexOf("test") === -1) {}
`,
			snapshot: `
declare const values: string[];
if (values.indexOf("test") < 0) {}
                           ~~~
                           Prefer \`values.indexOf("test") === -1\` over \`values.indexOf("test") < 0\` to check for non-existence.
`,
		},
		{
			code: `
declare const values: string[];
if (values.indexOf("test") >= 0) {}
`,
			output: `
declare const values: string[];
if (values.indexOf("test") !== -1) {}
`,
			snapshot: `
declare const values: string[];
if (values.indexOf("test") >= 0) {}
                           ~~~~
                           Prefer \`values.indexOf("test") !== -1\` over \`values.indexOf("test") >= 0\` to check for existence.
`,
		},
		{
			code: `
declare const values: string[];
if (values.indexOf("test") > -1) {}
`,
			output: `
declare const values: string[];
if (values.indexOf("test") !== -1) {}
`,
			snapshot: `
declare const values: string[];
if (values.indexOf("test") > -1) {}
                           ~~~~
                           Prefer \`values.indexOf("test") !== -1\` over \`values.indexOf("test") > -1\` to check for existence.
`,
		},
		{
			code: `
declare const values: string[];
if (values.lastIndexOf("test") < 0) {}
`,
			output: `
declare const values: string[];
if (values.lastIndexOf("test") === -1) {}
`,
			snapshot: `
declare const values: string[];
if (values.lastIndexOf("test") < 0) {}
                               ~~~
                               Prefer \`values.lastIndexOf("test") === -1\` over \`values.lastIndexOf("test") < 0\` to check for non-existence.
`,
		},
		{
			code: `
declare const values: number[];
if (values.findIndex((value) => value > 10) < 0) {}
`,
			output: `
declare const values: number[];
if (values.findIndex((value) => value > 10) === -1) {}
`,
			snapshot: `
declare const values: number[];
if (values.findIndex((value) => value > 10) < 0) {}
                                            ~~~
                                            Prefer \`values.findIndex((value) => value > 10) === -1\` over \`values.findIndex((value) => value > 10) < 0\` to check for non-existence.
`,
		},
		{
			code: `
declare const values: number[];
if (values.findLastIndex((value) => value > 10) >= 0) {}
`,
			output: `
declare const values: number[];
if (values.findLastIndex((value) => value > 10) !== -1) {}
`,
			snapshot: `
declare const values: number[];
if (values.findLastIndex((value) => value > 10) >= 0) {}
                                                ~~~~
                                                Prefer \`values.findLastIndex((value) => value > 10) !== -1\` over \`values.findLastIndex((value) => value > 10) >= 0\` to check for existence.
`,
		},
	],
	valid: [
		`
declare const index: number;
if (index === -1) {}
`,
		`
declare const index: number;
if (index !== -1) {}
`,
		`
declare const values: string[];
if (values.indexOf("test") === -1) {}
`,
		`
declare const values: string[];
if (values.indexOf("test") !== -1) {}
`,
		`
declare const values: string[];
if (values.lastIndexOf("test") === -1) {}
`,
		`
declare const values: number[];
if (values.findIndex((value) => value > 10) === -1) {}
`,
		`
declare const values: number[];
if (values.findLastIndex((value) => value > 10) !== -1) {}
`,
		`
declare const index: number;
if (index < 1) {}
`,
		`
declare const index: number;
if (index >= 1) {}
`,
		`
declare function someOtherCall(): number;
if (someOtherCall() < 0) {}
`,
	],
});
