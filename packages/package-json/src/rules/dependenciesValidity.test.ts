import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.dependenciesValidity, {
	invalid: [
		{
			code: `{
  "dependencies": null
}`,
			snapshot: `{
  "dependencies": null
                  ~~~~
                  Invalid dependencies: the value is \`null\`, but should be a record of dependencies.
}`,
		},
		{
			code: `{
  "dependencies": 123
}`,
			snapshot: `{
  "dependencies": 123
                  ~~~
                  Invalid dependencies: the type should be \`object\`, not \`number\`.
}`,
		},
		{
			code: `{
  "dependencies": []
}`,
			snapshot: `{
  "dependencies": []
                  ~~
                  Invalid dependencies: the type should be \`object\`, not \`array\`.
}`,
		},
		{
			code: `{
  "dependencies": "string"
}`,
			snapshot: `{
  "dependencies": "string"
                  ~~~~~~~~
                  Invalid dependencies: the type should be \`object\`, not \`string\`.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "dependencies": {}
}`,
		},
		{
			code: `{
  "dependencies": { "lodash": "^4.0.0" }
}`,
		},
	],
});
