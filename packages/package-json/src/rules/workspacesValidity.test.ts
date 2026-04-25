import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.workspacesValidity, {
	invalid: [
		{
			code: `
{
  "workspaces": null
}
`,
			snapshot: `
{
  "workspaces": null
                ~~~~
                Invalid workspaces: the value is \`null\`, but should be an \`Array\` of strings.
}
`,
		},
		{
			code: `
{
  "workspaces": 123
}
`,
			snapshot: `
{
  "workspaces": 123
                ~~~
                Invalid workspaces: the type should be \`Array\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "workspaces": "invalid"
}
`,
			snapshot: `
{
  "workspaces": "invalid"
                ~~~~~~~~~
                Invalid workspaces: the type should be \`Array\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "workspaces": {}
}
`,
			snapshot: `
{
  "workspaces": {}
                ~~
                Invalid workspaces: the type should be \`Array\`, not \`object\`.
}
`,
		},
		{
			code: `
{
  "workspaces": {
    "invalid-bin": 123
  }
}
`,
			snapshot: `
{
  "workspaces": {
                ~
                Invalid workspaces: the type should be \`Array\`, not \`object\`.
    "invalid-bin": 123
    ~~~~~~~~~~~~~~~~~~
  }
  ~
}
`,
		},
		{
			code: `
{
  "workspaces": ["valid", "", 123, null, {}]
}
`,
			snapshot: `
{
  "workspaces": ["valid", "", 123, null, {}]
                          ~~
                          Invalid workspaces: item at index 1 is empty, but should be a file path or glob pattern.
                              ~~~
                              Invalid workspaces: item at index 2 should be a string, not \`number\`.
                                   ~~~~
                                   Invalid workspaces: item at index 3 should be a string, not \`null\`.
                                         ~~
                                         Invalid workspaces: item at index 4 should be a string, not \`object\`.
}
`,
		},
	],
	valid: [
		`{}
`,
		`{
  "workspaces": []
}
`,
		`{
  "workspaces": ["./app", "./packages/*"]
}
`,
	],
});
