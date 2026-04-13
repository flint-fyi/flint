import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.manValidity, {
	invalid: [
		{
			code: `{
  "man": null
}`,
			snapshot: `{
  "man": null
         ~~~~
         Invalid man: the value is \`null\`, but should be an \`Array\` or a \`string\`.
}`,
		},
		{
			code: `{
  "man": 123
}`,
			snapshot: `{
  "man": 123
         ~~~
         Invalid man: the type should be \`Array\` or \`string\`, not \`number\`.
}`,
		},
		{
			code: `{
  "man": {}
}`,
			snapshot: `{
  "man": {}
         ~~
         Invalid man: the type should be \`Array\` or \`string\`, not \`object\`.
}`,
		},
		{
			code: `{
  "man": ""
}`,
			snapshot: `{
  "man": ""
         ~~
         Invalid man: the value is empty, but should be the path to a man file.
}`,
		},
		{
			code: `{
  "man": "./man/doc"
}`,
			snapshot: `{
  "man": "./man/doc"
         ~~~~~~~~~~~
         Invalid man: the value is not valid; it should be the path to a man file.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "man": "./man/doc.1"
}`,
		},
		{
			code: `{
  "man": []
}`,
		},
		{
			code: `{
  "man": ["./man/doc.1", "./man/doc.2.gz"]
}`,
		},
	],
});
