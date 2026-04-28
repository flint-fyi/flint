import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.moduleValidity, {
	invalid: [
		{
			code: `
{
  "module": null
}
`,
			snapshot: `
{
  "module": null
            ~~~~
            Invalid module: the value is \`null\`, but should be a \`string\`.
}
`,
		},
		{
			code: `
{
  "module": 123
}
`,
			snapshot: `
{
  "module": 123
            ~~~
            Invalid module: the type should be a \`string\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "module": []
}
`,
			snapshot: `
{
  "module": []
            ~~
            Invalid module: the type should be a \`string\`, not \`Array\`.
}
`,
		},
		{
			code: `
{
  "module": ""
}
`,
			snapshot: `
{
  "module": ""
            ~~
            Invalid module: the value is empty, but should be the path to the package's main module.
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "module": "./index.js"
}`,
		`{
  "module": "index.js"
}`,
	],
});
