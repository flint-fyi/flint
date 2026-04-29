import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.dependenciesValidity, {
	invalid: [
		{
			code: `
{
  "dependencies": null
}
`,
			snapshot: `
{
  "dependencies": null
                  ~~~~
                  Invalid dependencies: the value is \`null\`, but should be a record of dependencies.
}
`,
		},
		{
			code: `
{
  "dependencies": 123
}
`,
			snapshot: `
{
  "dependencies": 123
                  ~~~
                  Invalid dependencies: the type should be \`object\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "dependencies": "./script.js"
}
`,
			snapshot: `
{
  "dependencies": "./script.js"
                  ~~~~~~~~~~~~~
                  Invalid dependencies: the type should be \`object\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "dependencies": []
}
`,
			snapshot: `
{
  "dependencies": []
                  ~~
                  Invalid dependencies: the type should be \`object\`, not \`array\`.
}
`,
		},
		{
			code: `
{
  "dependencies": {
    "example": "bowie"
  }
}
`,
			snapshot: `
{
  "dependencies": {
    "example": "bowie"
               ~~~~~~~
               Invalid dependencies: invalid version range for dependency example: bowie.
  }
}
`,
		},
		{
			code: `
{
  "dependencies": {
    "example": 123
  }
}
`,
			snapshot: `
{
  "dependencies": {
    "example": 123
               ~~~
               Invalid dependencies: dependency version for example should be a string: 123.
  }
}
`,
		},
		{
			code: `
{
  "dependencies": {
    "example": null
  }
}
`,
			snapshot: `
{
  "dependencies": {
    "example": null
               ~~~~
               Invalid dependencies: dependency version for example should be a string: null.
  }
}
`,
		},
		{
			code: `
{
  "dependencies": {
    "example": {}
  }
}
`,
			snapshot: `
{
  "dependencies": {
    "example": {}
               ~~
               Invalid dependencies: dependency version for example should be a string: [object Object].
  }
}
`,
		},
		{
			code: `
{
  "dependencies": {
    "example": "workspace"
  }
}
`,
			snapshot: `
{
  "dependencies": {
    "example": "workspace"
               ~~~~~~~~~~~
               Invalid dependencies: invalid version range for dependency example: workspace.
  }
}
`,
		},
	],
	valid: [
		`{}
`,
		`{ "dependencies": {} }
`,
		`{
  "dependencies": {
    "example": "^1.2.3"
  }
}
`,
		`{
  "dependencies": {
    "example": "file:./example"
  }
}
`,
		`{
  "dependencies": {
    "example": "catalog:"
  }
}
`,
		`{
  "dependencies": {
    "example": "git+https://github.com/user/repo.git"
  }
}
`,
		`{
  "dependencies": {
    "example": "https://example.com/example.tgz"
  }
}
`,
		`{
  "dependencies": {
    "example": "workspace:^"
  }
}
`,
		`{
  "dependencies": {
    "example": "workspace:~"
  }
}
`,
		`{
  "dependencies": {
    "example": "workspace:*"
  }
}
`,
		`{
  "dependencies": {
    "example": "workspace:^1.2.3"
  }
}
`,
		`{
  "dependencies": {
    "example": "npm:example@^1.0.0"
  }
}
`,
	],
});
