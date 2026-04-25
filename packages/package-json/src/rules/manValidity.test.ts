import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.manValidity, {
	invalid: [
		{
			code: `
{
  "man": null
}
`,
			snapshot: `
{
  "man": null
         ~~~~
         Invalid man: the value is \`null\`, but should be an \`Array\` or a \`string\`.
}
`,
		},
		{
			code: `
{
  "man": 123
}
`,
			snapshot: `
{
  "man": 123
         ~~~
         Invalid man: the type should be \`Array\` or \`string\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "man": ""
}
`,
			snapshot: `
{
  "man": ""
         ~~
         Invalid man: the value is empty, but should be the path to a man file.
}
`,
		},
		{
			code: `
{
  "man": {
    "invalid-bin": 123
  }
}
`,
			snapshot: `
{
  "man": {
         ~
         Invalid man: the type should be \`Array\` or \`string\`, not \`object\`.
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
  "man": [
    "./man/doc.one",
    "./man/doc.gz",
    "./man/doc.Infinity",
    "man/doc",
    "",
    123,
    null,
    {}
  ]
}
`,
			snapshot: `
{
  "man": [
    "./man/doc.one",
    ~~~~~~~~~~~~~~~
    Invalid man: item at index 0 is not valid; it should be the path to a man file.
    "./man/doc.gz",
    ~~~~~~~~~~~~~~
    Invalid man: item at index 1 is not valid; it should be the path to a man file.
    "./man/doc.Infinity",
    ~~~~~~~~~~~~~~~~~~~~
    Invalid man: item at index 2 is not valid; it should be the path to a man file.
    "man/doc",
    ~~~~~~~~~
    Invalid man: item at index 3 is not valid; it should be the path to a man file.
    "",
    ~~
    Invalid man: item at index 4 is empty, but should be the path to a man file.
    123,
    ~~~
    Invalid man: item at index 5 should be a string, not \`number\`.
    null,
    ~~~~
    Invalid man: item at index 6 should be a string, not \`null\`.
    {}
    ~~
    Invalid man: item at index 7 should be a string, not \`object\`.
  ]
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "man": []
}`,
		`{
  "man": ["./man/doc.1", "./man/doc.2.gz"]
}`,
	],
});
