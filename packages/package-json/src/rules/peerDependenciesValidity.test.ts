import { directPropertyValidityRules } from "../directPropertyValidityRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyValidityRules.peerDependenciesValidity, {
	invalid: [
		{
			code: `
{
  "peerDependencies": null
}
`,
			snapshot: `
{
  "peerDependencies": null
                      ~~~~
                      Invalid peerDependencies: the value is \`null\`, but should be a record of dependencies.
}
`,
		},
		{
			code: `
{
  "peerDependencies": 123
}
`,
			snapshot: `
{
  "peerDependencies": 123
                      ~~~
                      Invalid peerDependencies: the type should be \`object\`, not \`number\`.
}
`,
		},
		{
			code: `
{
  "peerDependencies": "./script.js"
}
`,
			snapshot: `
{
  "peerDependencies": "./script.js"
                      ~~~~~~~~~~~~~
                      Invalid peerDependencies: the type should be \`object\`, not \`string\`.
}
`,
		},
		{
			code: `
{
  "peerDependencies": []
}
`,
			snapshot: `
{
  "peerDependencies": []
                      ~~
                      Invalid peerDependencies: the type should be \`object\`, not \`array\`.
}
`,
		},
		{
			code: `
{
  "peerDependencies": {
    "example": "bowie"
  }
}
`,
			snapshot: `
{
  "peerDependencies": {
    "example": "bowie"
               ~~~~~~~
               Invalid peerDependencies: invalid version range for dependency example: bowie.
  }
}
`,
		},
		{
			code: `
{
  "peerDependencies": {
    "example": 123
  }
}
`,
			snapshot: `
{
  "peerDependencies": {
    "example": 123
               ~~~
               Invalid peerDependencies: dependency version for example should be a string: 123.
  }
}
`,
		},
		{
			code: `
{
  "peerDependencies": {
    "example": null
  }
}
`,
			snapshot: `
{
  "peerDependencies": {
    "example": null
               ~~~~
               Invalid peerDependencies: dependency version for example should be a string: null.
  }
}
`,
		},
		{
			code: `
{
  "peerDependencies": {
    "example": {}
  }
}
`,
			snapshot: `
{
  "peerDependencies": {
    "example": {}
               ~~
               Invalid peerDependencies: dependency version for example should be a string: [object Object].
  }
}
`,
		},
		{
			code: `
{
  "peerDependencies": {
    "example": "workspace"
  }
}
`,
			snapshot: `
{
  "peerDependencies": {
    "example": "workspace"
               ~~~~~~~~~~~
               Invalid peerDependencies: invalid version range for dependency example: workspace.
  }
}
`,
		},
	],
	valid: [
		`
{}
`,
		`
{
  "peerDependencies": {}
}
`,
		`
{
  "peerDependencies": {
    "example": "^1.2.3"
  }
}
`,
		`
{
  "peerDependencies": {
    "example": "file:./example"
  }
}
`,
		`
{
  "peerDependencies": {
    "example": "catalog:"
  }
}
`,
		`
{
  "peerDependencies": {
    "example": "git+https://github.com/user/repo.git"
  }
}
`,
		`
{
  "peerDependencies": {
    "example": "https://example.com/example.tgz"
  }
}
`,
		`
{
  "peerDependencies": {
    "example": "workspace:^"
  }
}
`,
		`
{
  "peerDependencies": {
    "example": "workspace:~"
  }
}
`,
		`
{
  "peerDependencies": {
    "example": "workspace:*"
  }
}
`,
		`
{
  "peerDependencies": {
    "example": "workspace:^1.2.3"
  }
}
`,
		`
{
  "peerDependencies": {
    "example": "npm:example@^1.0.0"
  }
}
`,
	],
});
