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
			snapshot: `
{
  "dependencies": {
    "alpha": "1.0.0",
    ~~~~~~~
    This dependency is overridden by a duplicate entry later in the same dependency collection.
    "alpha": "2.0.0"
  }
}
`,
			suggestions: [
				{
					id: "fixOrder",
					updated: `
{
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
				},
			],
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
			snapshot: `
{
  "bundleDependencies": ["alpha", "beta", "alpha"]
                         ~~~~~~~
                         This dependency is overridden by a duplicate entry later in the same dependency collection.
}
`,
			suggestions: [
				{
					id: "fixOrder",
					updated: `
{
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
				},
			],
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
			snapshot: `
{
  "bundleDependencies": ["alpha", "beta", "gamma", "beta"]
                                  ~~~~~~
                                  This dependency is overridden by a duplicate entry later in the same dependency collection.
}
`,
			suggestions: [
				{
					id: "fixOrder",
					updated: `
{
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
				},
			],
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
			snapshot: `
{
  "bundledDependencies": ["alpha", "beta", "alpha"]
                          ~~~~~~~
                          This dependency is overridden by a duplicate entry later in the same dependency collection.
}
`,
			suggestions: [
				{
					id: "fixOrder",
					updated: `
{
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
				},
			],
		},
		{
			code: `
{
	"main": "index.js",
	"homepage": "https://example.com",
	"version": "1.0.0",
	"name": "order-sort-package-json-explicit",
	"repository": {
		"type": "git",
		"url": "git+https://github.com/fake/github.git"
	}
}
`,
			snapshot: `
{
  "overrides": {
    "alpha": "1.0.0",
    ~~~~~~~
    This dependency is overridden by a duplicate entry later in the same dependency collection.
    "alpha": "2.0.0"
  }
}
`,
			suggestions: [
				{
					id: "fixOrder",
					updated: `
{
	"name": "order-sort-package-json-explicit",
	"version": "1.0.0",
	"homepage": "https://example.com",
	"repository": {
		"type": "git",
		"url": "git+https://github.com/fake/github.git"
	},
	"main": "index.js"
}
`,
				},
			],
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
			snapshot: `
{
  "dependencies": {
    "alpha": "1.0.0"
  },
  "devDependencies": {
    "alpha": "1.0.0"
    ~~~~~~~
    This dependency is also declared in dependencies, which this rule treats as redundant here.
  }
}
`,
			suggestions: [
				{
					id: "fixOrder",
					updated: `
{
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
				},
			],
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
			snapshot: `
{
  "dependencies": {
    "alpha": "1.0.0"
  },
  "peerDependencies": {
    "alpha": "^1.0.0"
    ~~~~~~~
    This dependency is also declared in dependencies, which this rule treats as redundant here.
  }
}
`,
			suggestions: [
				{
					id: "fixOrder",
					updated: `
{
	"name": "sort-non-standard",
	"version": "1.0.0",
	"cpu": [
		"x64"
	],
	"a": "custom",
	"b": "workspace-config"
}
`,
				},
			],
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
			snapshot: `
{
  "dependencies": {
    "alpha": "1.0.0"
  },
  "peerDependencies": {
    "alpha": "^1.0.0"
    ~~~~~~~
    This dependency is also declared in dependencies, which this rule treats as redundant here.
  }
}
`,
			suggestions: [
				{
					id: "fixOrder",
					updated: `
{
	"name": "custom-order-with-sort",
	"version": "1.0.0",
	"custom-a": "value",
	"custom-z": "value"
}
`,
				},
			],
		},

		{
			code: ["{", '	"name": "foo"', '	"version": "1.0.0",', "}"].join("\r\n"),
			options: { customOrder: ["version", "name"] },
			snapshot: `
{
  "dependencies": {
    "alpha": "1.0.0"
  },
  "peerDependencies": {
    "alpha": "^1.0.0"
    ~~~~~~~
    This dependency is also declared in dependencies, which this rule treats as redundant here.
  }
}
`,
			suggestions: [
				{
					id: "fixOrder",
					updated: ["{", '	"version": "1.0.0"', '	"name": "foo",', "}"].join(
						"\r\n",
					),
				},
			],
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
