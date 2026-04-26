import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.filesValidity, {
	invalid: [
		{
			code: `
{
  "files": null
}
`,
			snapshot: `
{
  "files": null
           ~~~~
           Invalid files: the value is \`null\`, but should be an \`Array\` of strings.
}
`,
		},
		{
			code: `
{
  "files": 123
}
`,
			snapshot: `
{
  "files": 123
           ~~~
           Invalid files: the type should be \`Array\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "files": "invalid"
}
`,
			snapshot: `
{
  "files": "invalid"
           ~~~~~~~~~
           Invalid files: the type should be \`Array\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "files": {
    "invalid-bin": 123
  }
}
`,
			snapshot: `
{
  "files": {
           ~
           Invalid files: the type should be \`Array\`, not \`object\`.
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
  "files": ["valid", "", 123, null, {}]
}
`,
			snapshot: `
{
  "files": ["valid", "", 123, null, {}]
                     ~~
                     Invalid files: item at index 1 is empty, but should be a file pattern.
                         ~~~
                         Invalid files: item at index 2 should be a string, not \`number\`.
                              ~~~~
                              Invalid files: item at index 3 should be a string, not \`null\`.
                                    ~~
                                    Invalid files: item at index 4 should be a string, not \`object\`.
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "files": []
}`,
		`{
  "files": ["CHANGELOG.md", "dist/"]
}`,
	],
});
