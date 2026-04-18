import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.contributorsValidity, {
	invalid: [
		{
			code: `
{
  "contributors": null
}
`,
			snapshot: `
{
  "contributors": null
                  ~~~~
                  Invalid contributors: the type should be an \`Array\` of objects with at least a \`name\` property, and optionally \`email\` and \`url\`.
}
`,
		},
		{
			code: `
{
  "contributors": 123
}
`,
			snapshot: `
{
  "contributors": 123
                  ~~~
                  Invalid contributors: the type should be an \`Array\` of objects with at least a \`name\` property, and optionally \`email\` and \`url\`.
}
`,
		},
		{
			code: `
{
  "contributors": "./script.js"
}
`,
			snapshot: `
{
  "contributors": "./script.js"
                  ~~~~~~~~~~~~~
                  Invalid contributors: the type should be an \`Array\` of objects with at least a \`name\` property, and optionally \`email\` and \`url\`.
}
`,
		},
		{
			code: `
{
  "contributors": {}
}
`,
			snapshot: `
{
  "contributors": {}
                  ~~
                  Invalid contributors: the type should be an \`Array\` of objects with at least a \`name\` property, and optionally \`email\` and \`url\`.
}
`,
		},
		{
			code: `
{
  "contributors": ["string", true, 123, {}, []]
}
`,
			snapshot: `
{
  "contributors": ["string", true, 123, {}, []]
                   ~~~~~~~~
                   Invalid contributors: item 0 is invalid; it should be a person object with at least a \`name\`.
                             ~~~~
                             Invalid contributors: item 1 is invalid; it should be a person object with at least a \`name\`.
                                   ~~~
                                   Invalid contributors: item 2 is invalid; it should be a person object with at least a \`name\`.
                                        ~~
                                        Invalid contributors: item 3 is invalid; it should be a person object with at least a \`name\`.
                                            ~~
                                            Invalid contributors: item 4 is invalid; it should be a person object with at least a \`name\`.
}
`,
		},
		{
			code: `
{
  "contributors": [
    {
      "name": "",
      "email": "barney",
      "url": "rubble"
    },
    {
      "name": "fred",
      "email": "flintstone",
      "web": ".com"
    }
  ]
}
`,
			snapshot: `
{
  "contributors": [
    {
      "name": "",
      ~~~~~~~~~~
      Invalid contributors: name should not be empty.
      "email": "barney",
      ~~~~~~~~~~~~~~~~~
      Invalid contributors: email is not valid: barney.
      "url": "rubble"
      ~~~~~~~~~~~~~~~
      Invalid contributors: url is not valid: rubble.
    },
    {
      "name": "fred",
      "email": "flintstone",
      ~~~~~~~~~~~~~~~~~~~~~
      Invalid contributors: email is not valid: flintstone.
      "web": ".com"
      ~~~~~~~~~~~~~
      Invalid contributors: url is not valid: .com.
    }
  ]
}
`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "contributors": []
}`,
		},
		{
			code: `{
  "contributors": [{"name": "Fred Flintston", "email": "f@flintstone.com", "web": "https://flintstone.com"}]
}`,
		},
	],
});
