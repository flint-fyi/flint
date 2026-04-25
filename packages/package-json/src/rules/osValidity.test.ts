import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.osValidity, {
	invalid: [
		{
			code: `
{
  "os": null
}
`,
			snapshot: `
{
  "os": null
        ~~~~
        Invalid os: the value is \`null\`, but should be an \`Array\` of strings.
}
`,
		},
		{
			code: `
{
  "os": 123
}
`,
			snapshot: `
{
  "os": 123
        ~~~
        Invalid os: the type should be \`Array\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "os": "invalid"
}
`,
			snapshot: `
{
  "os": "invalid"
        ~~~~~~~~~
        Invalid os: the type should be \`Array\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "os": {}
}
`,
			snapshot: `
{
  "os": {}
        ~~
        Invalid os: the type should be \`Array\`, not \`object\`.
}
`,
		},
		{
			code: `
{
  "os": {
    "invalid-bin": 123
  }
}
`,
			snapshot: `
{
  "os": {
        ~
        Invalid os: the type should be \`Array\`, not \`object\`.
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
  "os": ["invalid", "", 123, null, {}]
}
`,
			snapshot: `
{
  "os": ["invalid", "", 123, null, {}]
         ~~~~~~~~~
         Invalid os: the value "invalid" is not valid. Valid OS values are: aix, android, darwin, freebsd, linux, openbsd, sunos, win32.
                    ~~
                    Invalid os: item at index 1 is empty, but should be the name of an operating system.
                        ~~~
                        Invalid os: item at index 2 should be a string, not \`number\`.
                             ~~~~
                             Invalid os: item at index 3 should be a string, not \`null\`.
                                   ~~
                                   Invalid os: item at index 4 should be a string, not \`object\`.
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "os": []
}`,
		`{
  "os": ["win32", "linux"]
}`,
	],
});
