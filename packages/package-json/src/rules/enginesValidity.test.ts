import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.enginesValidity, {
	invalid: [
		{
			code: `
{
  "engines": null
}
`,
			snapshot: `
{
  "engines": null
             ~~~~
             Invalid engines: the value is \`null\`, but should be an \`object\`.
}
`,
		},
		{
			code: `
{
  "engines": 123
}
`,
			snapshot: `
{
  "engines": 123
             ~~~
             Invalid engines: the type should be \`object\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "engines": ["node"]
}
`,
			snapshot: `
{
  "engines": ["node"]
             ~~~~~~~~
             Invalid engines: the type should be \`object\`, not \`Array\`.
}
`,
		},
		{
			code: `
{
  "engines": "node"
}
`,
			snapshot: `
{
  "engines": "node"
             ~~~~~~
             Invalid engines: the type should be \`object\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "engines": {
    "npm": 123
  }
}
`,
			snapshot: `
{
  "engines": {
    "npm": 123
           ~~~
           Invalid engines: the value of property "npm" should be a string.
  }
}
`,
		},
		{
			code: `
{
  "engines": {
    "invalid-bin": ""
  }
}
`,
			snapshot: `
{
  "engines": {
    "invalid-bin": ""
                   ~~
                   Invalid engines: the value of property "invalid-bin" is empty, but should be a semver range.
  }
}
`,
		},
		{
			code: `
{
  "engines": {
    "": "invalid-key",
    "   ": "invalid-key"
  }
}
`,
			snapshot: `
{
  "engines": {
    "": "invalid-key",
        ~~~~~~~~~~~~~
        Invalid engines: property 0 has an empty key, but should be a runtime or package manager.
    "   ": "invalid-key"
           ~~~~~~~~~~~~~
           Invalid engines: property 1 has an empty key, but should be a runtime or package manager.
  }
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "engines": {}
}`,
		`{
  "engines": {
    "node": "^24.11.0"
  }
}`,
		`{
  "engines": {
    "node": "^24.11.0",
    "npm": "Please use pnpm",
    "pnpm": "^10"
  }
}`,
	],
});
