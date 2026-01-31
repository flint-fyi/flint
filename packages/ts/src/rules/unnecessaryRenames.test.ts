import { ruleTester } from "./ruleTester.ts";
import rule from "./unnecessaryRenames.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import { value as value } from "module";
`,
			output: `
import { value } from "module";
`,
			snapshot: `
import { value as value } from "module";
         ~~~~~~~~~~~~~~
         Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
export { data as data };
`,
			output: `
export { data };
`,
			snapshot: `
export { data as data };
         ~~~~~~~~~~~~
         Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
const { key: key } = object;
`,
			output: `
const { key } = object;
`,
			snapshot: `
const { key: key } = object;
        ~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
import { foo as foo, bar } from "module";
`,
			output: `
import { foo, bar } from "module";
`,
			snapshot: `
import { foo as foo, bar } from "module";
         ~~~~~~~~~~
         Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
export { default as default };
`,
			output: `
export { default };
`,
			snapshot: `
export { default as default };
         ~~~~~~~~~~~~~~~~~~
         Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
const { property: property, another } = object;
`,
			output: `
const { property, another } = object;
`,
			snapshot: `
const { property: property, another } = object;
        ~~~~~~~~~~~~~~~~~~
        Renaming to the same identifier name is unnecessary.
`,
		},
		{
			code: `
function example({ param: param }: { param: number }) {
    return param;
}
`,
			output: `
function example({ param }: { param: number }) {
    return param;
}
`,
			snapshot: `
function example({ param: param }: { param: number }) {
                   ~~~~~~~~~~~~
                   Renaming to the same identifier name is unnecessary.
    return param;
}
`,
		},
		{
			code: `
export { type as type };
`,
			output: `
export { type };
`,
			snapshot: `
export { type as type };
         ~~~~~~~~~~~~
         Renaming to the same identifier name is unnecessary.
`,
		},
	],
	valid: [
		`import { value } from "module";`,
		`import { oldName as newName } from "module";`,
		`export { data };`,
		`export { oldData as newData };`,
		`const { key } = object;`,
		`const { oldKey: newKey } = object;`,
		`import { foo, bar } from "module";`,
		`export { default };`,
		`export { value as default };`,
		`const { property, another } = object;`,
		`function example({ param }: { param: number }) { return param; }`,
		`const { ...rest } = object;`,
		`import * as namespace from "module";`,
		`export * from "module";`,
	],
});
