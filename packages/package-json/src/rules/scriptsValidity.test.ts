import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.scriptsValidity, {
	invalid: [
		{
			code: `{
  "scripts": null
}`,
			snapshot: `{
  "scripts": null
             ~~~~
             Invalid scripts: the value is \`null\`, but should be an \`object\`.
}`,
		},
		{
			code: `{
  "scripts": 123
}`,
			snapshot: `{
  "scripts": 123
             ~~~
             Invalid scripts: the type should be \`object\`, not \`number\`.
}`,
		},
		{
			code: `{
  "scripts": ["tsc"]
}`,
			snapshot: `{
  "scripts": ["tsc"]
             ~~~~~~~
             Invalid scripts: the type should be \`object\`, not \`array\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "scripts": {}
}`,
		},
		{
			code: `{
  "scripts": { "build": "tsc", "test": "vitest" }
}`,
		},
	],
});
