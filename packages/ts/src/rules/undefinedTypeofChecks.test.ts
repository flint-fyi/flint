import { ruleTester } from "./ruleTester.ts";
import rule from "./undefinedTypeofChecks.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
if (typeof value === "undefined") {}
`,
			output: `
if (value === undefined) {}
`,
			snapshot: `
if (typeof value === "undefined") {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This \`typeof\` comparison can be simplified to \`=== undefined\`.
`,
		},
		{
			code: `
if (typeof value !== "undefined") {}
`,
			output: `
if (value !== undefined) {}
`,
			snapshot: `
if (typeof value !== "undefined") {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This \`typeof\` comparison can be simplified to \`=== undefined\`.
`,
		},
		{
			code: `
const isUndefined = typeof obj.prop === "undefined";
`,
			output: `
const isUndefined = obj.prop === undefined;
`,
			snapshot: `
const isUndefined = typeof obj.prop === "undefined";
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    This \`typeof\` comparison can be simplified to \`=== undefined\`.
`,
		},
		{
			code: `
if ("undefined" === typeof value) {}
`,
			output: `
if (value === undefined) {}
`,
			snapshot: `
if ("undefined" === typeof value) {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This \`typeof\` comparison can be simplified to \`=== undefined\`.
`,
		},
		{
			code: `
if (typeof value == "undefined") {}
`,
			output: `
if (value == undefined) {}
`,
			snapshot: `
if (typeof value == "undefined") {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This \`typeof\` comparison can be simplified to \`=== undefined\`.
`,
		},
	],
	valid: [
		`if (value === undefined) {}`,
		`if (value !== undefined) {}`,
		`if (typeof value === "string") {}`,
		`if (typeof value === "number") {}`,
		`if (typeof value === "object") {}`,
		`const type = typeof value;`,
		`if (value === "undefined") {}`,
	],
});
