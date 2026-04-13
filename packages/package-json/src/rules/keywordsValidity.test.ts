import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.keywordsValidity, {
	invalid: [
		{
			code: `{
  "keywords": null
}`,
			snapshot: `{
  "keywords": null
              ~~~~
              Invalid keywords: the value is \`null\`, but should be an \`Array\` of strings.
}`,
		},
		{
			code: `{
  "keywords": 123
}`,
			snapshot: `{
  "keywords": 123
              ~~~
              Invalid keywords: the type should be \`Array\`, not \`number\`.
}`,
		},
		{
			code: `{
  "keywords": {}
}`,
			snapshot: `{
  "keywords": {}
              ~~
              Invalid keywords: the type should be \`Array\`, not \`object\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "keywords": []
}`,
		},
		{
			code: `{
  "keywords": ["lint", "json"]
}`,
		},
	],
});
