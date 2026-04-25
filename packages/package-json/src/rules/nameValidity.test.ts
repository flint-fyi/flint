import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.nameValidity, {
	invalid: [
		{
			code: `
{
	"name": null
}
`,
			snapshot: `
{
	"name": null
	        ~~~~
	        Invalid name: the value is \`null\`, but should be a \`string\`.
}
`,
		},
		{
			code: `
{
	"name": 123
}
`,
			snapshot: `
{
	"name": 123
	        ~~~
	        Invalid name: the type should be a \`string\`, not \`number\`.
}
`,
		},
		{
			code: `
{
	"name": ""
}
`,
			snapshot: `
{
	"name": ""
	        ~~
	        Invalid name: the value is empty, but should be a valid name.
}
`,
		},
		{
			code: `
{
	"name": "excited!"
}
`,
			snapshot: `
{
	"name": "excited!"
	        ~~~~~~~~~~
	        Invalid name: name can no longer contain special characters ("~'!()*").
}
`,
		},
		{
			code: `
{
	"name": "$!"
}
`,
			snapshot: `
{
	"name": "$!"
	        ~~~~
	        Invalid name: name can only contain URL-friendly characters.
	        ~~~~
	        Invalid name: name can no longer contain special characters ("~'!()*").
}
`,
		},
		{
			code: `
{
	"name": " leading-space:and:weird:chars!"
}
`,
			snapshot: `
{
	"name": " leading-space:and:weird:chars!"
	        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	        Invalid name: name cannot contain leading or trailing spaces.
	        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	        Invalid name: name can only contain URL-friendly characters.
	        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	        Invalid name: name can no longer contain special characters ("~'!()*").
}
`,
		},
		{
			code: `
{
	"name": "InvalidPackageNameWithPrivateFalse",
	"private": false
}
`,
			snapshot: `
{
	"name": "InvalidPackageNameWithPrivateFalse",
	        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	        Invalid name: name can no longer contain capital letters.
	"private": false
}
`,
		},
	],
	valid: [
		"{}",
		`{ "name": "valid-package-name" }`,
		`{ "name": "@scoped/valid-package-name" }`,
		`{ "name": "valid-package-name", "private": true }`,
		`{ "name": "valid-package-name", "private": "true" }`,
	],
});
