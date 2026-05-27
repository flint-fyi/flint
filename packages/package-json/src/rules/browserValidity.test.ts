import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.browserValidity, {
	invalid: [
		{
			code: `
{
  "browser": null
}
`,
			snapshot: `
{
  "browser": null
             ~~~~
             Invalid browser: the value is \`null\`, but should be a \`string\`.
}
`,
		},
		{
			code: `
{
  "browser": 123
}
`,
			snapshot: `
{
  "browser": 123
             ~~~
             Invalid browser: the type should be a \`string\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "browser": {}
}
`,
			snapshot: `
{
  "browser": {}
             ~~
             Invalid browser: the type should be a \`string\`, not \`object\`.
}
`,
		},
		{
			code: `
{
  "browser": ""
}
`,
			snapshot: `
{
  "browser": ""
             ~~
             Invalid browser: the value is empty, but should be the path to the module that should be used in the browser.
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "browser": "./browser.js"
}`,
	],
});
