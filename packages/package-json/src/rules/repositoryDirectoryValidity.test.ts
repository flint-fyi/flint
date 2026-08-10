import { ruleTester } from "../ruleTester.ts";
import rule from "./repositoryDirectoryValidity.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "something-else"
  }
}
`,
			fileName: "packages/example/package.json",
			snapshot: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "something-else"
                 ~~~~~~~~~~~~~~~~
                 The repository directory should match this package.json file's directory.
  }
}
`,
		},
		{
			code: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "packages/example"
  }
}
`,
			snapshot: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "packages/example"
                 ~~~~~~~~~~~~~~~~~~
                 The repository directory should match this package.json file's directory.
  }
}
`,
		},
	],
	valid: [
		`{}`,
		`
{
  "repository": "flint-fyi/flint"
}
`,
		`
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint"
  }
}
`,
		{
			code: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "packages/example"
  }
}
`,
			fileName: "packages/example/package.json",
		},
		{
			code: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "packages/example"
  }
}
`,
			fileName: "workspace/packages/example/package.json",
		},
	],
});
