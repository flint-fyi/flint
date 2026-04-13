import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.publishConfigValidity, {
	invalid: [
		{
			code: `{
  "publishConfig": null
}`,
			snapshot: `{
  "publishConfig": null
                   ~~~~
                   Invalid publishConfig: the value is \`null\`, but should be an \`object\`.
}`,
		},
		{
			code: `{
  "publishConfig": "string"
}`,
			snapshot: `{
  "publishConfig": "string"
                   ~~~~~~~~
                   Invalid publishConfig: the type should be \`object\`, not \`string\`.
}`,
		},
		{
			code: `{
  "publishConfig": ["array", "of", "values"]
}`,
			snapshot: `{
  "publishConfig": ["array", "of", "values"]
                   ~~~~~~~~~~~~~~~~~~~~~~~~~
                   Invalid publishConfig: the type should be \`object\`, not \`Array\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "publishConfig": {}
}`,
		},
		{
			code: `{
  "publishConfig": {
    "access": "restricted"
  }
}`,
		},
	],
});
