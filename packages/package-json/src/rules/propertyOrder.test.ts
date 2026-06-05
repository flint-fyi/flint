import { ruleTester } from "../ruleTester.ts";
import rule from "./propertyOrder.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
	"main": "index.js",
	"homepage": "https://example.com",
	"version": "1.0.0",
	"name": "order-sort-package-json-implicit",
	"repository": {
		"type": "git",
		"url": "git+https://github.com/fake/github.git"
	}
}
`,
			output: `{
	"name": "order-sort-package-json-implicit",
	"version": "1.0.0",
	"homepage": "https://example.com",
	"repository": {
		"type": "git",
		"url": "git+https://github.com/fake/github.git"
	},
	"main": "index.js"
}
`,
			snapshot: `
{
	"main": "index.js",
	~~~~~~
	Top-level property \`main\` is not ordered in the standard way.
	"homepage": "https://example.com",
	~~~~~~~~~~
	Top-level property \`homepage\` is not ordered in the standard way.
	"version": "1.0.0",
	~~~~~~~~~
	Top-level property \`version\` is not ordered in the standard way.
	"name": "order-sort-package-json-implicit",
	~~~~~~
	Top-level property \`name\` is not ordered in the standard way.
	"repository": {
	~~~~~~~~~~~~
	Top-level property \`repository\` is not ordered in the standard way.
		"type": "git",
		"url": "git+https://github.com/fake/github.git"
	}
}
`,
		},
		{
			code: `
{
	"name": "error-not-started-at-first",
	"main": "index.js",
	"homepage": "https://example.com",
	"version": "1.0.0",
	"repository": {
		"type": "git",
		"url": "git+https://github.com/fake/github.git"
	}
}
`,
			output: `{
	"name": "error-not-started-at-first",
	"version": "1.0.0",
	"homepage": "https://example.com",
	"repository": {
		"type": "git",
		"url": "git+https://github.com/fake/github.git"
	},
	"main": "index.js"
}
`,
			snapshot: `
{
	"name": "error-not-started-at-first",
	"main": "index.js",
	~~~~~~
	Top-level property \`main\` is not ordered in the standard way.
	"homepage": "https://example.com",
	"version": "1.0.0",
	~~~~~~~~~
	Top-level property \`version\` is not ordered in the standard way.
	"repository": {
	~~~~~~~~~~~~
	Top-level property \`repository\` is not ordered in the standard way.
		"type": "git",
		"url": "git+https://github.com/fake/github.git"
	}
}
`,
		},
		{
			code: `
{
	"main": "index.js",
	"homepage": "https://example.com",
	"version": "1.0.0",
	"name": "do-not-sort-sub-keys",
	"repository": {
		"url": "git+https://github.com/fake/github.git",
		"type": "git"
	}
}
`,
			output: `{
	"name": "do-not-sort-sub-keys",
	"version": "1.0.0",
	"homepage": "https://example.com",
	"repository": {
		"url": "git+https://github.com/fake/github.git",
		"type": "git"
	},
	"main": "index.js"
}
`,
			snapshot: `
{
	"main": "index.js",
	~~~~~~
	Top-level property \`main\` is not ordered in the standard way.
	"homepage": "https://example.com",
	~~~~~~~~~~
	Top-level property \`homepage\` is not ordered in the standard way.
	"version": "1.0.0",
	~~~~~~~~~
	Top-level property \`version\` is not ordered in the standard way.
	"name": "do-not-sort-sub-keys",
	~~~~~~
	Top-level property \`name\` is not ordered in the standard way.
	"repository": {
	~~~~~~~~~~~~
	Top-level property \`repository\` is not ordered in the standard way.
		"url": "git+https://github.com/fake/github.git",
		"type": "git"
	}
}
`,
		},
		{
			code: `
{
  "main": "index.js",
  "homepage": "https://example.com",
  "version": "1.0.0",
  "name": "respect-indent",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fake/github.git"
  }
}
`,
			output: `{
  "name": "respect-indent",
  "version": "1.0.0",
  "homepage": "https://example.com",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/fake/github.git"
  },
  "main": "index.js"
}
`,
			snapshot: `
{
  "main": "index.js",
  ~~~~~~
  Top-level property \`main\` is not ordered in the standard way.
  "homepage": "https://example.com",
  ~~~~~~~~~~
  Top-level property \`homepage\` is not ordered in the standard way.
  "version": "1.0.0",
  ~~~~~~~~~
  Top-level property \`version\` is not ordered in the standard way.
  "name": "respect-indent",
  ~~~~~~
  Top-level property \`name\` is not ordered in the standard way.
  "repository": {
  ~~~~~~~~~~~~
  Top-level property \`repository\` is not ordered in the standard way.
    "type": "git",
    "url": "git+https://github.com/fake/github.git"
  }
}
`,
		},
		{
			code: `
{
	"main": "index.js",
	"homepage": "https://example.com",
	"version": "1.0.0",
	"name": "order-custom",
	"repository": {
		"type": "git",
		"url": "git+https://github.com/fake/github.git"
	}
}
`,
			options: { customOrder: ["version", "name", "repository"] },
			output: `{
	"version": "1.0.0",
	"name": "order-custom",
	"repository": {
		"type": "git",
		"url": "git+https://github.com/fake/github.git"
	},
	"homepage": "https://example.com",
	"main": "index.js"
}
`,
			snapshot: `
{
	"main": "index.js",
	~~~~~~
	Top-level property \`main\` is not ordered in the standard way.
	"homepage": "https://example.com",
	~~~~~~~~~~
	Top-level property \`homepage\` is not ordered in the standard way.
	"version": "1.0.0",
	~~~~~~~~~
	Top-level property \`version\` is not ordered in the standard way.
	"name": "order-custom",
	~~~~~~
	Top-level property \`name\` is not ordered in the standard way.
	"repository": {
	~~~~~~~~~~~~
	Top-level property \`repository\` is not ordered in the standard way.
		"type": "git",
		"url": "git+https://github.com/fake/github.git"
	}
}
`,
		},
		{
			code: `
{
	"b": "workspace-config",
	"cpu": ["x64"],
	"a": "custom",
	"name": "sort-non-standard",
	"version": "1.0.0"
}
`,
			output: `{
	"name": "sort-non-standard",
	"version": "1.0.0",
	"cpu": [
		"x64"
	],
	"a": "custom",
	"b": "workspace-config"
}
`,
			snapshot: `
{
	"b": "workspace-config",
	~~~
	Top-level property \`b\` is not ordered in the standard way.
	"cpu": ["x64"],
	~~~~~
	Top-level property \`cpu\` is not ordered in the standard way.
	"a": "custom",
	~~~
	Top-level property \`a\` is not ordered in the standard way.
	"name": "sort-non-standard",
	~~~~~~
	Top-level property \`name\` is not ordered in the standard way.
	"version": "1.0.0"
	~~~~~~~~~
	Top-level property \`version\` is not ordered in the standard way.
}
`,
		},

		{
			code: `
{
	"custom-z": "value",
	"name": "custom-order-with-sort",
	"custom-a": "value",
	"version": "1.0.0"
}
`,
			output: `{
	"name": "custom-order-with-sort",
	"version": "1.0.0",
	"custom-a": "value",
	"custom-z": "value"
}
`,
			snapshot: `
{
	"custom-z": "value",
	~~~~~~~~~~
	Top-level property \`custom-z\` is not ordered in the standard way.
	"name": "custom-order-with-sort",
	~~~~~~
	Top-level property \`name\` is not ordered in the standard way.
	"custom-a": "value",
	"version": "1.0.0"
	~~~~~~~~~
	Top-level property \`version\` is not ordered in the standard way.
}
`,
		},

		{
			// flint-disable-next-line flint/testCaseNonStaticCode
			code: ["{", '	"name": "foo",', '	"version": "1.0.0"', "}"].join("\r\n"),
			options: { customOrder: ["version", "name"] },
			output: ["{", '	"version": "1.0.0",', '	"name": "foo"', "}"].join("\r\n"),
			snapshot:
				'{\r\n	"name": "foo",\r\n	~~~~~~\n	Top-level property `name` is not ordered in the standard way.\n	"version": "1.0.0"\r\n	~~~~~~~~~\n	Top-level property `version` is not ordered in the standard way.\n}',
		},
	],
	valid: [
		`{}`,
		`
{
	"name": "treat-yo-self",
	"version": "1.1.1",
	"description": "Once a year.",
	"keywords": [
		"modern",
		"master"
	],
	"exports": {
		"import": "./index.js",
		"require": "./index.js"
	},
	"main": "index.js"
}
`,
		`
{
	"name": "treat-yo-self",
	"version": "0.1.0",
	"private": true,
	"description": "Once a year.",
	"keywords": [
		"modern",
		"master"
	]
}
`,
		{
			code: `
{
	"version": "1.1.1",
	"name": "treat-yo-self",
	"description": "Once a year.",
	"keywords": [
		"modern",
		"master"
	]
}`,
			options: { customOrder: ["version", "name"] },
		},
		`
{
    "name": "only-top-level-keys-are-ordered",
    "version": "1.0.0",
    "homepage": "https://example.com",
    "repository": {
        "url": "git+https://github.com/fake/github.git",
        "type": "git"
    },
    "main": "index.js"
}
`,
		`
{
	"name": "sorted-non-standard",
	"version": "1.0.0",
	"cpu": ["x64"],
	"a-custom": "value",
	"z-custom": "value"
}
`,
	],
});
