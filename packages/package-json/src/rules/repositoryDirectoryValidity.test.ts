import path from "node:path";

import { describe } from "vitest";

import { repositoryRootRuleTester, ruleTester } from "../ruleTester.ts";
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

describe("with a known repository root", () => {
	repositoryRootRuleTester.describe(rule, {
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
				suggestions: [
					{
						id: "replaceRepositoryDirectory",
						updated: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "packages/package-json/src/_flint-rule-tester-virtual/packages/example"
  }
}
`,
					},
				],
			},
			{
				code: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "example"
  }
}
`,
				fileName: "packages/example/package.json",
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
    "directory": "packages/package-json/src/_flint-rule-tester-virtual/packages/example"
  }
}
`,
					},
				],
			},
			{
				code: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "."
  }
}
`,
				fileName: path.resolve(import.meta.dirname, "../../../../package.json"),
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
				code: `
{
  "repository": {
    "type": "git",
    "url": "https://github.com/flint-fyi/flint",
    "directory": "packages/package-json/src/_flint-rule-tester-virtual/packages/example"
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
    "directory": ""
  }
}
`,
				fileName: path.resolve(import.meta.dirname, "../../../../package.json"),
				name: "an empty directory for a package.json in the repository root itself",
			},
		],
	});
});
