import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.licenseValidity, {
	invalid: [
		{
			code: `{
  "license": null
}`,
			snapshot: `{
  "license": null
             ~~~~
             Invalid license: the value is \`null\`, but should be a \`string\`.
}`,
		},
		{
			code: `{
  "license": 123
}`,
			snapshot: `{
  "license": 123
             ~~~
             Invalid license: the type should be a \`string\`, not \`number\`.
}`,
		},
		{
			code: `{
  "license": {}
}`,
			snapshot: `{
  "license": {}
             ~~
             Invalid license: the type should be a \`string\`, not \`object\`.
}`,
		},
		{
			code: `{
  "license": []
}`,
			snapshot: `{
  "license": []
             ~~
             Invalid license: the type should be a \`string\`, not \`Array\`.
}`,
		},
		{
			code: `{
  "license": true
}`,
			snapshot: `{
  "license": true
             ~~~~
             Invalid license: the type should be a \`string\`, not \`boolean\`.
}`,
		},
		{
			code: `{
  "license": ""
}`,
			snapshot: `{
  "license": ""
             ~~
             Invalid license: the value is empty, but should be a valid license.
}`,
		},
		{
			code: `{
  "license": "   "
}`,
			snapshot: `{
  "license": "   "
             ~~~~~
             Invalid license: the value is empty, but should be a valid license.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "license": "MIT"
}`,
		},
		{
			code: `{
  "license": "Apache-2.0"
}`,
		},
		{
			code: `{
  "license": "UNLICENSED"
}`,
		},
	],
});
