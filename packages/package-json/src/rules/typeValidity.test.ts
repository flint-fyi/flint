import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.typeValidity, {
	invalid: [
		{
			code: `
{
  "type": null
}
`,
			snapshot: `
{
  "type": null
          ~~~~
          Invalid type: the value is \`null\`, but should be a \`string\`.
}
`,
		},
		{
			code: `
{
  "type": 123
}
`,
			snapshot: `
{
  "type": 123
          ~~~
          Invalid type: the type should be a \`string\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "type": ""
}
`,
			snapshot: `
{
  "type": ""
          ~~
          Invalid type: the value is empty, but should be one of: commonjs, module.
}
`,
		},
	],
	valid: [
		`{}`,
		`{
  "type": "commonjs"
}`,
		`{
  "type": "module"
}`,
	],
});
