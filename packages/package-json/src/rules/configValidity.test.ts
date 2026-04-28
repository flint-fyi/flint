import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.configValidity, {
	invalid: [
		{
			code: `
{
  "config": null
}
`,
			snapshot: `
{
  "config": null
            ~~~~
            Invalid config: the value is \`null\`, but should be an \`object\`.
}
`,
		},
		{
			code: `
{
  "config": 123
}
`,
			snapshot: `
{
  "config": 123
            ~~~
            Invalid config: the type should be \`object\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "config": "string"
}
`,
			snapshot: `
{
  "config": "string"
            ~~~~~~~~
            Invalid config: the type should be \`object\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "config": ["array", "of", "values"]
}
`,
			snapshot: `
{
  "config": ["array", "of", "values"]
            ~~~~~~~~~~~~~~~~~~~~~~~~~
            Invalid config: the type should be \`object\`, not \`array\`.
}
`,
		},
		{
			code: `
{
  "config": []
}
`,
			snapshot: `
{
  "config": []
            ~~
            Invalid config: the type should be \`object\`, not \`array\`.
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "config": {}
}`,
		`{
  "config": { "port": 8080 }
}`,
		`{
  "config": { "first": { "node": "./first.js" }, "second": "node ./second.js" }
}`,
		`{
  "config": { "first": { "value": "First" }, "second": "node ./second.js" }
}`,
	],
});
