import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.repositoryValidity, {
	invalid: [
		{
			code: `{
  "repository": null
}`,
			snapshot: `{
  "repository": null
                ~~~~
                Invalid repository: the value is \`null\`, but should be an \`object\` or a \`string\`.
}`,
		},
		{
			code: `{
  "repository": 123
}`,
			snapshot: `{
  "repository": 123
                ~~~
                Invalid repository: the type should be \`object\` or \`string\`, not \`number\`.
}`,
		},
		{
			code: `{
  "repository": ["git", "url"]
}`,
			snapshot: `{
  "repository": ["git", "url"]
                ~~~~~~~~~~~~~~
                Invalid repository: the type should be \`object\` or \`string\`, not \`Array\`.
}`,
		},
		{
			code: `{
  "repository": ""
}`,
			snapshot: `{
  "repository": ""
                ~~
                Invalid repository: the value is empty, but should be repository shorthand string.
}`,
		},
	],
	valid: [
		{
			code: `{}`,
		},
		{
			code: `{
  "repository": "github:npm/example"
}`,
		},
		{
			code: `{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/npm/cli.git"
  }
}`,
		},
	],
});
