import { javascriptRuleTester } from "./ruleTester.ts";
import rule from "./unsafeNegations.ts";

javascriptRuleTester.describe(rule, {
	invalid: [
		{
			files: {
				"file.js": `
const key = "property";
const object = {};

!key in object;
`,
			},
			snapshot: {
				"file.js": `
const key = "property";
const object = {};

!key in object;
~
This negation applies before the \`in\` operator.
`,
			},
		},
	],
	valid: [
		{
			files: {
				"file.js": `
const key = "property";
const object = {};

!(key in object);
`,
			},
		},
		{
			files: {
				"file.js": `
const object = new Date();
const Constructor = Date;

!(object instanceof Constructor);
`,
			},
		},
		{
			files: {
				"file.js": `
const key = "property";
const object = {};

key in object;
`,
			},
		},
		{
			files: {
				"file.js": `
const object = new Date();
const Constructor = Date;

object instanceof Constructor;
`,
			},
		},
		{
			files: {
				"file.js": `
const flag = false;
const key = "property";
const object = {};

!flag && key in object;
`,
			},
		},
	],
});
