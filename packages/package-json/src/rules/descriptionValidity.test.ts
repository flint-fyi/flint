import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.descriptionValidity, {
	invalid: [
		{
			code: `
{
  "description": null
}
`,
			snapshot: `
{
  "description": null
                 ~~~~
                 Invalid description: the value is \`null\`, but should be a \`string\`.
}
`,
		},
		{
			code: `
{
  "description": 123
}
`,
			snapshot: `
{
  "description": 123
                 ~~~
                 Invalid description: the type should be a \`string\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "description": {}
}
`,
			snapshot: `
{
  "description": {}
                 ~~
                 Invalid description: the type should be a \`string\`, not \`object\`.
}
`,
		},
		{
			code: `
{
  "description": []
}
`,
			snapshot: `
{
  "description": []
                 ~~
                 Invalid description: the type should be a \`string\`, not \`Array\`.
}
`,
		},
		{
			code: `
{
  "description": true
}
`,
			snapshot: `
{
  "description": true
                 ~~~~
                 Invalid description: the type should be a \`string\`, not \`boolean\`.
}
`,
		},
		{
			code: `
{
  "description": ""
}
`,
			snapshot: `
{
  "description": ""
                 ~~
                 Invalid description: the value is empty, but should be a description.
}
`,
		},
		{
			code: `
{
  "description": "   "
}
`,
			snapshot: `
{
  "description": "   "
                 ~~~~~
                 Invalid description: the value is empty, but should be a description.
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "description": "The Fragile"
}`,
	],
});
