import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.libcValidity, {
	invalid: [
		{
			code: `
{
  "libc": null
}
`,
			snapshot: `
{
  "libc": null
          ~~~~
          Invalid libc: the value is \`null\`, but should be an \`Array\` or a \`string\`.
}
`,
		},
		{
			code: `
{
  "libc": 123
}
`,
			snapshot: `
{
  "libc": 123
          ~~~
          Invalid libc: the type should be \`Array\` or \`string\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "libc": {}
}
`,
			snapshot: `
{
  "libc": {}
          ~~
          Invalid libc: the type should be \`Array\` or \`string\`, not \`object\`.
}
`,
		},
		{
			code: `
{
  "libc": ""
}
`,
			snapshot: `
{
  "libc": ""
          ~~
          Invalid libc: the value is empty, but should be the name of a version of libc.
}
`,
		},
		{
			code: `
{
  "libc": ["glibc", "", 123]
}
`,
			snapshot: `
{
  "libc": ["glibc", "", 123]
                    ~~
                    Invalid libc: item at index 1 is empty, but should be the name of a version of libc.
                        ~~~
                        Invalid libc: item at index 2 should be a string, not \`number\`.
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "libc": "glibc"
}`,
		`{
  "libc": ["glibc", "musl"]
}`,
	],
});
