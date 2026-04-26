import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.optionalDependenciesValidity, {
	invalid: [
		{
			code: `
{
  "optionalDependencies": null
}
`,
			snapshot: `
{
  "optionalDependencies": null
                          ~~~~
                          Invalid optionalDependencies: the value is \`null\`, but should be a record of dependencies.
}
`,
		},
		{
			code: `
{
  "optionalDependencies": 123
}
`,
			snapshot: `
{
  "optionalDependencies": 123
                          ~~~
                          Invalid optionalDependencies: the type should be \`object\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "optionalDependencies": "./script.js"
}
`,
			snapshot: `
{
  "optionalDependencies": "./script.js"
                          ~~~~~~~~~~~~~
                          Invalid optionalDependencies: the type should be \`object\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "optionalDependencies": []
}
`,
			snapshot: `
{
  "optionalDependencies": []
                          ~~
                          Invalid optionalDependencies: the type should be \`object\`, not \`array\`.
}
`,
		},
		{
			code: `
{
  "optionalDependencies": {
    "example": "bowie"
  }
}
`,
			snapshot: `
{
  "optionalDependencies": {
    "example": "bowie"
               ~~~~~~~
               Invalid optionalDependencies: invalid version range for dependency example: bowie.
  }
}
`,
		},
		{
			code: `
{
  "optionalDependencies": {
    "example": 123
  }
}
`,
			snapshot: `
{
  "optionalDependencies": {
    "example": 123
               ~~~
               Invalid optionalDependencies: dependency version for example should be a string: 123.
  }
}
`,
		},
		{
			code: `
{
  "optionalDependencies": {
    "example": null
  }
}
`,
			snapshot: `
{
  "optionalDependencies": {
    "example": null
               ~~~~
               Invalid optionalDependencies: dependency version for example should be a string: null.
  }
}
`,
		},
		{
			code: `
{
  "optionalDependencies": {
    "example": {}
  }
}
`,
			snapshot: `
{
  "optionalDependencies": {
    "example": {}
               ~~
               Invalid optionalDependencies: dependency version for example should be a string: [object Object].
  }
}
`,
		},
		{
			code: `
{
  "optionalDependencies": {
    "example": "workspace"
  }
}
`,
			snapshot: `
{
  "optionalDependencies": {
    "example": "workspace"
               ~~~~~~~~~~~
               Invalid optionalDependencies: invalid version range for dependency example: workspace.
  }
}
`,
		},
	],
	valid: [
		`{}`,
		`
{
  "optionalDependencies": {}
}
`,
		`
{
  "optionalDependencies": {
    "example": "^1.2.3"
  }
}
`,
		`
{
  "optionalDependencies": {
    "example": "file:./example"
  }
}
`,
		`
{
  "optionalDependencies": {
    "example": "catalog:"
  }
}
`,
		`
{
  "optionalDependencies": {
    "example": "git+https://github.com/user/repo.git"
  }
}
`,
		`
{
  "optionalDependencies": {
    "example": "https://example.com/example.tgz"
  }
}
`,
		`
{
  "optionalDependencies": {
    "example": "workspace:^"
  }
}
`,
		`
{
  "optionalDependencies": {
    "example": "workspace:~"
  }
}
`,
		`
{
  "optionalDependencies": {
    "example": "workspace:*"
  }
}
`,
		`
{
  "optionalDependencies": {
    "example": "workspace:^1.2.3"
  }
}
`,
		`
{
  "optionalDependencies": {
    "example": "npm:example@^1.0.0"
  }
}
`,
	],
});
