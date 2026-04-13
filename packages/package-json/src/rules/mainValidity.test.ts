import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.mainValidity, {
	invalid: [
		{
			code: `{
  "main": null
}`,
			snapshot: `{
  "main": null
          ~~~~
          Invalid main: the value is \`null\`, but should be a \`string\`.
}`,
		},
		{
			code: `{
  "main": 123
}`,
			snapshot: `{
  "main": 123
          ~~~
          Invalid main: the type should be a \`string\`, not \`number\`.
}`,
		},
		{
			code: `{
  "main": {}
}`,
			snapshot: `{
  "main": {}
          ~~
          Invalid main: the type should be a \`string\`, not \`object\`.
}`,
		},
		{
			code: `{
  "main": []
}`,
			snapshot: `{
  "main": []
          ~~
          Invalid main: the type should be a \`string\`, not \`Array\`.
}`,
		},
		{
			code: `{
  "main": true
}`,
			snapshot: `{
  "main": true
          ~~~~
          Invalid main: the type should be a \`string\`, not \`boolean\`.
}`,
		},
		{
			code: `{
  "main": ""
}`,
			snapshot: `{
  "main": ""
          ~~
          Invalid main: the value is empty, but should be the path to the package's main module.
}`,
		},
		{
			code: `{
  "main": "   "
}`,
			snapshot: `{
  "main": "   "
          ~~~~~
          Invalid main: the value is empty, but should be the path to the package's main module.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "main": "index.js"
}`,
		},
	],
});
