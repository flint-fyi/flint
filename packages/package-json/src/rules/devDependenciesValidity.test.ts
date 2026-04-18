import { directPropertyValidityRules } from "./directPropertyValidityRules.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.devDependenciesValidity, {
	invalid: [
		{
			code: `
{
  "devDependencies": null
}
`,
			snapshot: `
{
  "devDependencies": null
                     ~~~~
                     Invalid devDependencies: the value is \`null\`, but should be a record of dependencies.
}
`,
		},
		{
			code: `
{
  "devDependencies": 123
}
`,
			snapshot: `
{
  "devDependencies": 123
                     ~~~
                     Invalid devDependencies: the type should be \`object\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "devDependencies": "./script.js"
}
`,
			snapshot: `
{
  "devDependencies": "./script.js"
                     ~~~~~~~~~~~~~
                     Invalid devDependencies: the type should be \`object\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "devDependencies": []
}
`,
			snapshot: `
{
  "devDependencies": []
                     ~~
                     Invalid devDependencies: the type should be \`object\`, not \`array\`.
}
`,
		},
		{
			code: `
{
  "devDependencies": {
    "example": "bowie"
  }
}
`,
			snapshot: `
{
  "devDependencies": {
    "example": "bowie"
    ~~~~~~~~~~~~~~~~~~
    Invalid devDependencies: invalid version range for dependency example: bowie.
  }
}
`,
		},
		{
			code: `
{
  "devDependencies": {
    "example": 123
  }
}
`,
			snapshot: `
{
  "devDependencies": {
    "example": 123
    ~~~~~~~~~~~~~~
    Invalid devDependencies: dependency version for example should be a string: 123.
  }
}
`,
		},
		{
			code: `
{
  "devDependencies": {
    "example": null
  }
}
`,
			snapshot: `
{
  "devDependencies": {
    "example": null
    ~~~~~~~~~~~~~~~
    Invalid devDependencies: dependency version for example should be a string: null.
  }
}
`,
		},
		{
			code: `
{
  "devDependencies": {
    "example": {}
  }
}
`,
			snapshot: `
{
  "devDependencies": {
    "example": {}
    ~~~~~~~~~~~~~
    Invalid devDependencies: dependency version for example should be a string: [object Object].
  }
}
`,
		},
		{
			code: `
{
  "devDependencies": {
    "example": "workspace"
  }
}
`,
			snapshot: `
{
  "devDependencies": {
    "example": "workspace"
    ~~~~~~~~~~~~~~~~~~~~~~
    Invalid devDependencies: invalid version range for dependency example: workspace.
  }
}
`,
		},
	],
	valid: [
		{
			code: `{}
`,
		},
		{
			code: `{
  "devDependencies": {}
}
`,
		},
		{
			code: `{
  "devDependencies": {
    "example": "^1.2.3"
  }
}
`,
		},
		{
			code: `{
  "devDependencies": {
    "example": "file:./example"
  }
}
`,
		},
		{
			code: `{
  "devDependencies": {
    "example": "catalog:"
  }
}
`,
		},
		{
			code: `{
  "devDependencies": {
    "example": "git+https://github.com/user/repo.git"
  }
}
`,
		},
		{
			code: `{
  "devDependencies": {
    "example": "https://example.com/example.tgz"
  }
}
`,
		},
		{
			code: `{
  "devDependencies": {
    "example": "workspace:^"
  }
}
`,
		},
		{
			code: `{
  "devDependencies": {
    "example": "workspace:~"
  }
}
`,
		},
		{
			code: `{
  "devDependencies": {
    "example": "workspace:*"
  }
}
`,
		},
		{
			code: `{
  "devDependencies": {
    "example": "workspace:^1.2.3"
  }
}
`,
		},
		{
			code: `{
  "devDependencies": {
    "example": "npm:example@^1.0.0"
  }
}
`,
		},
	],
});
