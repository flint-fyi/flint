import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.exportsValidity, {
	invalid: [
		{
			code: `{
  "exports": null
}`,
			snapshot: `{
  "exports": null
             ~~~~
             Invalid exports: the value is \`null\`, but should be an \`object\` or \`string\`.
}`,
		},
		{
			code: `{
  "exports": 123
}`,
			snapshot: `{
  "exports": 123
             ~~~
             Invalid exports: the type should be \`object\` or \`string\`, not \`number\`.
}`,
		},
		{
			code: `{
  "exports": ["./index.js"]
}`,
			snapshot: `{
  "exports": ["./index.js"]
             ~~~~~~~~~~~~~~
             Invalid exports: the type should be \`object\` or \`string\`, not \`Array\`.
}`,
		},
		{
			code: `{
  "exports": ""
}`,
			snapshot: `{
  "exports": ""
             ~~
             Invalid exports: the value is empty, but should be an entry point path.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "exports": "./index.js"
}`,
		},
		{
			code: `{
  "exports": {
    ".": "./index.js"
  }
}`,
		},
	],
});
