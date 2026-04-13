import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.homepageValidity, {
	invalid: [
		{
			code: `{
  "homepage": null
}`,
			snapshot: `{
  "homepage": null
              ~~~~
              Invalid homepage: the value is \`null\`, but should be a \`string\`.
}`,
		},
		{
			code: `{
  "homepage": 123
}`,
			snapshot: `{
  "homepage": 123
              ~~~
              Invalid homepage: the type should be a \`string\`, not \`number\`.
}`,
		},
		{
			code: `{
  "homepage": {}
}`,
			snapshot: `{
  "homepage": {}
              ~~
              Invalid homepage: the type should be a \`string\`, not \`object\`.
}`,
		},
		{
			code: `{
  "homepage": []
}`,
			snapshot: `{
  "homepage": []
              ~~
              Invalid homepage: the type should be a \`string\`, not \`Array\`.
}`,
		},
		{
			code: `{
  "homepage": true
}`,
			snapshot: `{
  "homepage": true
              ~~~~
              Invalid homepage: the type should be a \`string\`, not \`boolean\`.
}`,
		},
		{
			code: `{
  "homepage": ""
}`,
			snapshot: `{
  "homepage": ""
              ~~
              Invalid homepage: the value is empty, but should be a valid url.
}`,
		},
		{
			code: `{
  "homepage": "   "
}`,
			snapshot: `{
  "homepage": "   "
              ~~~~~
              Invalid homepage: the value is empty, but should be a valid url.
}`,
		},
		{
			code: `{
  "homepage": "not-a-url"
}`,
			snapshot: `{
  "homepage": "not-a-url"
              ~~~~~~~~~~~
              Invalid homepage: the value is not a valid url.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "homepage": "https://example.com"
}`,
		},
	],
});
