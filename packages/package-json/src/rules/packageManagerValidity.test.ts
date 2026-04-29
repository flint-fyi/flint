import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.packageManagerValidity, {
	invalid: [
		{
			code: `
{
  "packageManager": null
}
`,
			snapshot: `
{
  "packageManager": null
                    ~~~~
                    Invalid packageManager: the value is \`null\`, but should be a \`string\`.
}
`,
		},
		{
			code: `
{
  "packageManager": 123
}
`,
			snapshot: `
{
  "packageManager": 123
                    ~~~
                    Invalid packageManager: the type should be a \`string\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "packageManager": ""
}
`,
			snapshot: `
{
  "packageManager": ""
                    ~~
                    Invalid packageManager: the value is empty, but should be the name and version of a package manager (e.g. "pnpm@10.3.0").
}
`,
		},
		{
			code: `
{
  "packageManager": "pnpm"
}
`,
			snapshot: `
{
  "packageManager": "pnpm"
                    ~~~~~~
                    Invalid packageManager: the value should be in the form "name@version" (e.g. "pnpm@10.3.0").
}
`,
		},
		{
			code: `
{
  "packageManager": "pip@1.2.3"
}
`,
			snapshot: `
{
  "packageManager": "pip@1.2.3"
                    ~~~~~~~~~~~
                    Invalid packageManager: the package manager "pip" is not supported. Supported package managers are: npm, pnpm, yarn, bun, deno.
}
`,
		},
		{
			code: `
{
  "packageManager": "pnpm@latest"
}
`,
			snapshot: `
{
  "packageManager": "pnpm@latest"
                    ~~~~~~~~~~~~~
                    Invalid packageManager: the version "latest" is not valid. It should be a valid semver version (optionally with a hash)..
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "packageManager": "pnpm@10.3.0"
}`,
		`{
  "packageManager": "npm@1.2.3"
}`,
		`{
  "packageManager": "yarn@4.5.1"
}`,
	],
});
