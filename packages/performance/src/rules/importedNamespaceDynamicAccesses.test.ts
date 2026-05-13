import rule from "./importedNamespaceDynamicAccesses.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import * as mod from "module";
const value = mod[property];
`,
			snapshot: `
import * as mod from "module";
const value = mod[property];
              ~~~~~~~~~~~~~
              Avoid computed member access on namespace imports as it prevents tree-shaking optimizations.
`,
		},
		{
			code: `
import * as utils from "./utils";
function getValue(key: string) {
    return utils[key];
}
`,
			snapshot: `
import * as utils from "./utils";
function getValue(key: string) {
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
const method = getMethod();
api[method]();
`,
			snapshot: `
import * as api from "./api";
const method = getMethod();
api[method]();
~~~~~~~~~~~
Avoid computed member access on namespace imports as it prevents tree-shaking optimizations.
`,
		},
	],
	valid: [
		`
import * as mod from "module";
const value = mod.property;
`,
		`
import * as utils from "./utils";
function getValue() {
    return utils.someFunction();
}
`,
		`
import { property } from "module";
const value = someObject[property];
`,
		`
import * as helpers from "helpers";
const result = helpers.someHelper();
`,
		`
const obj = { key: "value" };
const value = obj["key"];
`,
		`
import defaultExport from "module";
const value = defaultExport[property];
`,
	],
});
