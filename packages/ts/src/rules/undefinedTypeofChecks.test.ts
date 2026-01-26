import rule from "./undefinedTypeofChecks.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `if (typeof value === "undefined") {}`,
			snapshot: `if (typeof value === "undefined") {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Use direct undefined comparison instead of typeof.`,
		},
		{
			code: `if (typeof value !== "undefined") {}`,
			snapshot: `if (typeof value !== "undefined") {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Use direct undefined comparison instead of typeof.`,
		},
		{
			code: `const isUndefined = typeof obj.prop === "undefined";`,
			snapshot: `const isUndefined = typeof obj.prop === "undefined";
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    Use direct undefined comparison instead of typeof.`,
		},
		{
			code: `if ("undefined" === typeof value) {}`,
			snapshot: `if ("undefined" === typeof value) {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Use direct undefined comparison instead of typeof.`,
		},
		{
			code: `if (typeof value == "undefined") {}`,
			snapshot: `if (typeof value == "undefined") {}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Use direct undefined comparison instead of typeof.`,
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
