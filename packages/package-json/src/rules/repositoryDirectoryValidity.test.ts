import { describe } from "vitest";

import { repositoryRootRuleTester, ruleTester } from "../ruleTester.ts";
import rule from "./repositoryDirectoryValidity.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			files: {
				"packages/example/package.json": `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "something-else"
  }
}
`,
			},
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
			files: {
				"packages/example/package.json": `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "packages/example"
  }
}
`,
			},
		},
		{
			files: {
				"workspace/packages/example/package.json": `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "packages/example"
  }
}
`,
			},
		},
	],
});

describe("with a known repository root", () => {
	repositoryRootRuleTester.describe(rule, {
		invalid: [
			{
				files: {
					"packages/example/package.json": `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "something-else"
  }
}
`,
				},
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
				suggestions: [
					{
						id: "replaceRepositoryDirectory",
						updated: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "packages/example"
  }
}
`,
					},
				],
			},
			{
				files: {
					"packages/example/package.json": `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "example"
  }
}
`,
				},
				name: "a directory that only matches the trailing path segment",
				snapshot: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "example"
                 ~~~~~~~~~
                 The repository directory should match this package.json file's directory.
  }
}
`,
				suggestions: [
					{
						id: "replaceRepositoryDirectory",
						updated: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "packages/example"
  }
}
`,
					},
				],
			},
			{
				files: {
					"package.json": `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "."
  }
}
`,
				},
				name: "a package.json in the repository root itself",
				snapshot: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "."
                 ~~~
                 The repository directory should match this package.json file's directory.
  }
}
`,
				suggestions: [
					{
						id: "replaceRepositoryDirectory",
						updated: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": ""
  }
}
`,
					},
				],
			},
		],
		valid: [
			{
				files: {
					"packages/example/package.json": `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "packages/example"
  }
}
`,
				},
			},
			{
				files: {
					"package.json": `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": ""
  }
}
`,
				},
				name: "an empty directory for a package.json in the repository root itself",
			},
		],
	});
});
