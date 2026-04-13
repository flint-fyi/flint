import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.contributorsValidity, {
	invalid: [
		{
			code: `{
  "contributors": 123
}`,
			snapshot: `{
  "contributors": 123
                  ~~~
                  Invalid contributors: the type should be an \`Array\` of objects with at least a \`name\` property, and optionally \`email\` and \`url\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "contributors": [{ "name": "John" }]
}`,
		},
	],
});
