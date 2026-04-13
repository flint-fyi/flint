import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.enginesValidity, {
	invalid: [
		{
			code: `{
  "engines": null
}`,
			snapshot: `{
  "engines": null
             ~~~~
             Invalid engines: the value is \`null\`, but should be an \`object\`.
}`,
		},
		{
			code: `{
  "engines": 123
}`,
			snapshot: `{
  "engines": 123
             ~~~
             Invalid engines: the type should be \`object\`, not \`number\`.
}`,
		},
		{
			code: `{
  "engines": ["node"]
}`,
			snapshot: `{
  "engines": ["node"]
             ~~~~~~~~
             Invalid engines: the type should be \`object\`, not \`Array\`.
}`,
		},
		{
			code: `{
  "engines": "node"
}`,
			snapshot: `{
  "engines": "node"
             ~~~~~~
             Invalid engines: the type should be \`object\`, not \`string\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "engines": {}
}`,
		},
		{
			code: `{
  "engines": {
    "node": "^20.0.0"
  }
}`,
		},
	],
});
