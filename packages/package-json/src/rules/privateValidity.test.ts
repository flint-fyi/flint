import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.privateValidity, {
	invalid: [
		{
			code: `
{
  "private": null
}
`,
			snapshot: `
{
  "private": null
             ~~~~
             Invalid private: the value is \`null\`, but should be a \`boolean\`.
}
`,
		},
		{
			code: `
{
  "private": 123
}
`,
			snapshot: `
{
  "private": 123
             ~~~
             Invalid private: the type should be a \`boolean\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "private": {}
}
`,
			snapshot: `
{
  "private": {}
             ~~
             Invalid private: the type should be a \`boolean\`, not \`object\`.
}
`,
		},
		{
			code: `
{
  "private": []
}
`,
			snapshot: `
{
  "private": []
             ~~
             Invalid private: the type should be a \`boolean\`, not \`Array\`.
}
`,
		},
		{
			code: `
{
  "private": "true"
}
`,
			snapshot: `
{
  "private": "true"
             ~~~~~~
             Invalid private: the type should be a \`boolean\`, not \`string\`.
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "private": true
}`,
		`{
  "private": false
}`,
	],
});
