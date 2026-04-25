import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.versionValidity, {
	invalid: [
		{
			code: `
{
	"version": null
}
`,
			snapshot: `
{
	"version": null
	           ~~~~
	           Invalid version: the value is \`null\`, but should be a \`string\`.
}
`,
		},
		{
			code: `
{ "version": 123 }
`,
			snapshot: `
{ "version": 123 }
             ~~~
             Invalid version: the type should be a \`string\`, not \`number\`.
`,
		},
		{
			code: `
{ "version": "" }
`,
			snapshot: `
{ "version": "" }
             ~~
             Invalid version: the value is empty, but should be a valid version.
`,
		},
		{
			code: `
{ "version": "latest" }
`,
			snapshot: `
{ "version": "latest" }
             ~~~~~~~~
             Invalid version: the value is not a valid semver version.
`,
		},
		{
			code: `
{ "version": "?!" }
`,
			snapshot: `
{ "version": "?!" }
             ~~~~
             Invalid version: the value is not a valid semver version.
`,
		},
		{
			code: `
{ "version": "1" }
`,
			snapshot: `
{ "version": "1" }
             ~~~
             Invalid version: the value is not a valid semver version.
`,
		},
		{
			code: `
{ "version": "1.2" }
`,
			snapshot: `
{ "version": "1.2" }
             ~~~~~
             Invalid version: the value is not a valid semver version.
`,
		},
	],
	valid: [
		"{}",
		`{ "version": "1.2.3" }`,
		`{ "version": "1.2.3-beta" }`,
		`{ "version": "1.2.3-beta.0" }`,
	],
});
