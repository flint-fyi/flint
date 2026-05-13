import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.licenseValidity, {
	invalid: [
		{
			code: `
{
  "license": null
}
`,
			snapshot: `
{
  "license": null
             ~~~~
             Invalid license: the value is \`null\`, but should be a \`string\`.
}
`,
		},
		{
			code: `
{
  "license": 123
}
`,
			snapshot: `
{
  "license": 123
             ~~~
             Invalid license: the type should be a \`string\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "license": ""
}
`,
			snapshot: `
{
  "license": ""
             ~~
             Invalid license: the value is empty, but should be a valid license.
}
`,
		},
		{
			code: `
{
  "license": "not-a-license"
}
`,
			snapshot: `
{
  "license": "not-a-license"
             ~~~~~~~~~~~~~~~
             Invalid license: license should be a valid SPDX license expression (without "LicenseRef"), "UNLICENSED", or "SEE LICENSE IN <filename>".
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "license": "MIT"
}`,
		`{
  "license": "UNLICENSED"
}`,
		`{
  "license": "SEE LICENSE IN LICENSE.md"
}`,
	],
});
