import rule from "./importedNamespaceDynamicAccesses.ts";
import { ruleTester } from "./ruleTester.ts";

const supportingFiles = {
	"api.ts": `
export function method() {}
`,
	"node_modules/helpers/index.ts": `
export const someKey = undefined;
export function someHelper() {}
`,
	"node_modules/module/index.ts": `
export const property = "property";
const defaultExport = { property };
export default defaultExport;
`,
	"utils.ts": `
export const key = undefined;
export function someFunction() {}
`,
};

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import * as mod from "module";
const property = "property";
const value = mod[property];
`,
			files: supportingFiles,
			snapshot: `
import * as mod from "module";
const property = "property";
const value = mod[property];
              ~~~~~~~~~~~~~
              Avoid computed member access on namespace imports as it prevents tree-shaking optimizations.
`,
		},
		{
			code: `
import * as utils from "./utils";
function getValue(key: keyof typeof utils) {
    return utils[key];
}
`,
			files: supportingFiles,
			snapshot: `
import * as utils from "./utils";
function getValue(key: keyof typeof utils) {
    return utils[key];
           ~~~~~~~~~~
           Avoid computed member access on namespace imports as it prevents tree-shaking optimizations.
}
`,
		},
		{
			code: `
import * as helpers from "helpers";
const key = "someKey";
const result = helpers[key];
`,
			files: supportingFiles,
			snapshot: `
import * as helpers from "helpers";
const key = "someKey";
const result = helpers[key];
               ~~~~~~~~~~~~
               Avoid computed member access on namespace imports as it prevents tree-shaking optimizations.
`,
		},
		{
			code: `
import * as api from "./api";
function getMethod(): "method" {
    return "method";
}
const method = getMethod();
api[method]();
`,
			files: supportingFiles,
			snapshot: `
import * as api from "./api";
function getMethod(): "method" {
    return "method";
}
const method = getMethod();
api[method]();
~~~~~~~~~~~
Avoid computed member access on namespace imports as it prevents tree-shaking optimizations.
`,
		},
	],
	valid: [
		{
			code: `
import * as mod from "module";
const value = mod.property;
`,
			files: supportingFiles,
		},
		{
			code: `
import * as utils from "./utils";
function getValue() {
    return utils.someFunction();
}
`,
			files: supportingFiles,
		},
		{
			code: `
import { property } from "module";
const someObject: Record<string, unknown> = {};
const value = someObject[property];
`,
			files: supportingFiles,
		},
		{
			code: `
import * as helpers from "helpers";
const result = helpers.someHelper();
`,
			files: supportingFiles,
		},
		`
const obj = { key: "value" };
const value = obj["key"];
`,
		{
			code: `
import defaultExport from "module";
const property = "property";
const value = defaultExport[property];
`,
			files: supportingFiles,
		},
	],
});
