import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.keywordsValidity, {
	invalid: [
		{
			code: `
{
  "keywords": null
}
`,
			snapshot: `
{
  "keywords": null
              ~~~~
              Invalid keywords: the value is \`null\`, but should be an \`Array\` of strings.
}
`,
		},
		{
			code: `
{
  "keywords": 123
}
`,
			snapshot: `
{
  "keywords": 123
              ~~~
              Invalid keywords: the type should be \`Array\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "keywords": "invalid"
}
`,
			snapshot: `
{
  "keywords": "invalid"
              ~~~~~~~~~
              Invalid keywords: the type should be \`Array\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "keywords": {}
}
`,
			snapshot: `
{
  "keywords": {}
              ~~
              Invalid keywords: the type should be \`Array\`, not \`object\`.
}
`,
		},
		{
			code: `
{
  "keywords": {
    "invalid-bin": 123
  }
}
`,
			snapshot: `
{
  "keywords": {
              ~
              Invalid keywords: the type should be \`Array\`, not \`object\`.
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
  "keywords": ["valid", "", 123, null, {}]
}
`,
			snapshot: `
{
  "keywords": ["valid", "", 123, null, {}]
                        ~~
                        Invalid keywords: item at index 1 is empty, but should be a keyword string.
                            ~~~
                            Invalid keywords: item at index 2 should be a string, not \`number\`.
                                 ~~~~
                                 Invalid keywords: item at index 3 should be a string, not \`null\`.
                                       ~~
                                       Invalid keywords: item at index 4 should be a string, not \`object\`.
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "keywords": []
}`,
		`{
  "keywords": ["first","Second"]
}`,
	],
});
