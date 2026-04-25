import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.directoriesValidity, {
	invalid: [
		{
			code: `
{
  "directories": null
}
`,
			snapshot: `
{
  "directories": null
                 ~~~~
                 Invalid directories: the value is \`null\`, but should be an \`object\`.
}
`,
		},
		{
			code: `
{
  "directories": 123
}
`,
			snapshot: `
{
  "directories": 123
                 ~~~
                 Invalid directories: the type should be \`object\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "directories": ["dist/bin", "docs"]
}
`,
			snapshot: `
{
  "directories": ["dist/bin", "docs"]
                 ~~~~~~~~~~~~~~~~~~~~
                 Invalid directories: the type should be \`object\`, not \`array\`.
}
`,
		},
		{
			code: `
{
  "directories": "./script.js"
}
`,
			snapshot: `
{
  "directories": "./script.js"
                 ~~~~~~~~~~~~~
                 Invalid directories: the type should be \`object\`, not \`string\`.
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "directories": {}
}`,
		`{
  "directories": {
    "bin": "dist/bin",
    "man": "docs"
  }
}`,
	],
});
