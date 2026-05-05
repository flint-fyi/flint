import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.gypfileValidity, {
	invalid: [
		{
			code: `
{
  "gypfile": null
}
`,
			snapshot: `
{
  "gypfile": null
             ~~~~
             Invalid gypfile: the value is \`null\`, but should be a \`boolean\`.
}
`,
		},
		{
			code: `
{
  "gypfile": 123
}
`,
			snapshot: `
{
  "gypfile": 123
             ~~~
             Invalid gypfile: the value should be a \`boolean\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "gypfile": {}
}
`,
			snapshot: `
{
  "gypfile": {}
             ~~
             Invalid gypfile: the value should be a \`boolean\`, not \`object\`.
}
`,
		},
		{
			code: `
{
  "gypfile": "true"
}
`,
			snapshot: `
{
  "gypfile": "true"
             ~~~~~~
             Invalid gypfile: the value should be a \`boolean\`, not \`string\`.
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "gypfile": false
}`,
		`{
  "gypfile": true
}`,
	],
});
