import { ruleTester } from "./ruleTester.ts";
import rule from "./undefinedTypeofChecks.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
declare const value: unknown;

if (typeof value === "undefined") {}
`,
			output: `
declare const value: unknown;

if (value === undefined) {}
`,
			snapshot: `
declare const value: unknown;

if (typeof value === "undefined") {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This \`typeof\` comparison can be simplified to \`=== undefined\`.
`,
		},
		{
			code: `
declare const value: unknown;

if (typeof value !== "undefined") {}
`,
			output: `
declare const value: unknown;

if (value !== undefined) {}
`,
			snapshot: `
declare const value: unknown;

if (typeof value !== "undefined") {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This \`typeof\` comparison can be simplified to \`=== undefined\`.
`,
		},
		{
			code: `
declare const obj: { prop: unknown };

const isUndefined = typeof obj.prop === "undefined";
void isUndefined;
`,
			output: `
declare const obj: { prop: unknown };

const isUndefined = obj.prop === undefined;
void isUndefined;
`,
			snapshot: `
declare const obj: { prop: unknown };

const isUndefined = typeof obj.prop === "undefined";
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    This \`typeof\` comparison can be simplified to \`=== undefined\`.
void isUndefined;
`,
		},
		{
			code: `
declare const value: unknown;

if ("undefined" === typeof value) {}
`,
			output: `
declare const value: unknown;

if (value === undefined) {}
`,
			snapshot: `
declare const value: unknown;

if ("undefined" === typeof value) {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This \`typeof\` comparison can be simplified to \`=== undefined\`.
`,
		},
		{
			code: `
declare const value: unknown;

if (typeof value == "undefined") {}
`,
			output: `
declare const value: unknown;

if (value == undefined) {}
`,
			snapshot: `
declare const value: unknown;

if (typeof value == "undefined") {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~
    This \`typeof\` comparison can be simplified to \`=== undefined\`.
`,
		},
	],
	valid: [
		`
declare const value: unknown;

if (value === undefined) {}
`,
		`
declare const value: unknown;

if (value !== undefined) {}
`,
		`
declare const value: unknown;

if (typeof value === "string") {}
`,
		`
declare const value: unknown;

if (typeof value === "number") {}
`,
		`
declare const value: unknown;

if (typeof value === "object") {}
`,
		`
declare const value: unknown;

const type = typeof value;
void type;
`,
		`
declare const value: unknown;

if (value === "undefined") {}
`,
	],
});
