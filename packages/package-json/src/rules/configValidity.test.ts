import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.configValidity, {
	invalid: [
		{
			code: `{
  "config": null
}`,
			snapshot: `{
  "config": null
            ~~~~
            Invalid config: the value is \`null\`, but should be an \`object\`.
}`,
		},
		{
			code: `{
  "config": "string"
}`,
			snapshot: `{
  "config": "string"
            ~~~~~~~~
            Invalid config: the type should be \`object\`, not \`string\`.
}`,
		},
		{
			code: `{
  "config": ["array", "of", "values"]
}`,
			snapshot: `{
  "config": ["array", "of", "values"]
            ~~~~~~~~~~~~~~~~~~~~~~~~~
            Invalid config: the type should be \`object\`, not \`array\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "config": {}
}`,
		},
		{
			code: `{
  "config": { "port": 8080 }
}`,
		},
	],
});
