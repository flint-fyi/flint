import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.fundingValidity, {
	invalid: [
		{
			code: `
{
  "funding": null
}
`,
			snapshot: `
{
  "funding": null
             ~~~~
             Invalid funding: the value should be an object with \`type\` and \`url\`, a string, or an Array of the two.
}
`,
		},
		{
			code: `
{
  "funding": 123
}
`,
			snapshot: `
{
  "funding": 123
             ~~~
             Invalid funding: the value should be an object with \`type\` and \`url\`, a string, or an Array of the two.
}
`,
		},
		{
			code: `
{
  "funding": ""
}
`,
			snapshot: `
{
  "funding": ""
             ~~
             Invalid funding: the value is empty, but should be a URL.
}
`,
		},
		{
			code: `
{
  "funding": "not-a-url"
}
`,
			snapshot: `
{
  "funding": "not-a-url"
             ~~~~~~~~~~~
             Invalid funding: the value should be a valid URL.
}
`,
		},
		{
			code: `
{
  "funding": {}
}
`,
			snapshot: `
{
  "funding": {}
             ~~
             Invalid funding: missing required property \`type\` in funding object.
             ~~
             Invalid funding: missing required property \`url\` in funding object.
}
`,
		},
		{
			code: `
{
  "funding": {
    "type": 123,
    "url": "",
    "extra": true
  }
}
`,
			snapshot: `
{
  "funding": {
    "type": 123,
            ~~~
            Invalid funding: the \`type\` property should be a string, but got number.
    "url": "",
           ~~
           Invalid funding: the \`url\` property should not be empty.
    "extra": true
             ~~~~
             Invalid funding: unexpected property \`extra\`; only \`type\` and \`url\` are allowed in a funding object.
  }
}
`,
		},
		{
			code: `
{
  "funding": [
    null,
    {
      "type": "",
      "url": "not-a-url"
    },
    "https://example.com"
  ]
}
`,
			snapshot: `
{
  "funding": [
    null,
    ~~~~
    Invalid funding: the value should be an object with \`type\` and \`url\` or a string URL.
    {
      "type": "",
              ~~
              Invalid funding: the \`type\` property should not be empty.
      "url": "not-a-url"
             ~~~~~~~~~~~
             Invalid funding: the \`url\` property should be a valid URL.
    },
    "https://example.com"
  ]
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "funding": "https://example.com/donate"
}`,
		`{
  "funding": {
    "type": "individual",
    "url": "https://example.com/donate"
  }
}`,
		`{
  "funding": [
    "https://example.com/donate",
    {
      "type": "patreon",
      "url": "https://example.com/patreon"
    }
  ]
}`,
	],
});
