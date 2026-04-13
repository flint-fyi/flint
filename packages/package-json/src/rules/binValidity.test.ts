import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.binValidity, {
	invalid: [
		{
			code: `{
  "bin": null
}`,
			snapshot: `{
  "bin": null
         ~~~~
         Invalid bin: the value is \`null\`, but should be a \`string\` or an \`object\`.
}`,
		},
		{
			code: `{
  "bin": 123
}`,
			snapshot: `{
  "bin": 123
         ~~~
         Invalid bin: the type should be \`string\` or \`object\`, not \`number\`.
}`,
		},
		{
			code: `{
  "bin": ["./cli.js"]
}`,
			snapshot: `{
  "bin": ["./cli.js"]
         ~~~~~~~~~~~~
         Invalid bin: the type should be \`string\` or \`object\`, not \`array\`.
}`,
		},
		{
			code: `{
  "bin": ""
}`,
			snapshot: `{
  "bin": ""
         ~~
         Invalid bin: the value is empty, but should be a relative path.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "bin": "./cli.js"
}`,
		},
		{
			code: `{
  "bin": { "my-cli": "./cli.js" }
}`,
		},
	],
});
