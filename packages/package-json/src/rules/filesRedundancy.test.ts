import { ruleTester } from "../ruleTester.ts";
import rule from "./filesRedundancy.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
  "files": [
    "README.md",
    "dist/"
  ]
}
`,
			snapshot: `
{
  "files": [
    "README.md",
    ~~~~~~~~~~~
    Declaring "README.md" in \`files\` is unnecessary; it is included by default.
    "dist/"
  ]
}
`,
			suggestions: [
				{
					id: "removeFilesEntry",
					updated: `
{
  "files": [
    "dist/"
  ]
}
`,
				},
			],
		},
		{
			code: `
{
  "main": "./lib/index.js",
  "files": [
    "lib/index.js",
    "dist/"
  ]
}
`,
			snapshot: `
{
  "main": "./lib/index.js",
  "files": [
    "lib/index.js",
    ~~~~~~~~~~~~~~
    Declaring "lib/index.js" in \`files\` is unnecessary; it is already the \`main\` entry.
    "dist/"
  ]
}
`,
			suggestions: [
				{
					id: "removeFilesEntry",
					updated: `
{
  "main": "./lib/index.js",
  "files": [
    "dist/"
  ]
}
`,
				},
			],
		},
		{
			code: `
{
  "bin": {
    "run-package": "./bin/run.js"
  },
  "files": [
    "bin/run.js",
    "dist/"
  ]
}
`,
			snapshot: `
{
  "bin": {
    "run-package": "./bin/run.js"
  },
  "files": [
    "bin/run.js",
    ~~~~~~~~~~~~
    Declaring "bin/run.js" in \`files\` is unnecessary; it is already included via \`bin\`.
    "dist/"
  ]
}
`,
			suggestions: [
				{
					id: "removeFilesEntry",
					updated: `
{
  "bin": {
    "run-package": "./bin/run.js"
  },
  "files": [
    "dist/"
  ]
}
`,
				},
			],
		},
		{
			code: `
{
  "files": [
    "COPYING.md",
    "dist/"
  ]
}
`,
			snapshot: `
{
  "files": [
    "COPYING.md",
    ~~~~~~~~~~~~
    Declaring "COPYING.md" in \`files\` is unnecessary; it is included by default.
    "dist/"
  ]
}
`,
			suggestions: [
				{
					id: "removeFilesEntry",
					updated: `
{
  "files": [
    "dist/"
  ]
}
`,
				},
			],
		},
		{
			code: `
{
  "files": [
    "dist/",
    "dist/"
  ]
}
`,
			snapshot: `
{
  "files": [
    "dist/",
    "dist/"
    ~~~~~~~
    \`files\` has more than one entry for "dist/".
  ]
}
`,
			suggestions: [
				{
					id: "removeFilesEntry",
					updated: `
{
  "files": [
    "dist/"
  ]
}
`,
				},
			],
		},
		{
			code: `
{
  "bin": "./bin/run.js",
  "files": [
    "bin/run.js",
    "dist/"
  ]
}
`,
			snapshot: `
{
  "bin": "./bin/run.js",
  "files": [
    "bin/run.js",
    ~~~~~~~~~~~~
    Declaring "bin/run.js" in \`files\` is unnecessary; it is already included via \`bin\`.
    "dist/"
  ]
}
`,
			suggestions: [
				{
					id: "removeFilesEntry",
					updated: `
{
  "bin": "./bin/run.js",
  "files": [
    "dist/"
  ]
}
`,
				},
			],
		},
		{
			code: `
{
  "main": "lib/index.js",
  "files": [
    "LIB/index.js",
    "dist/"
  ]
}
`,
			snapshot: `
{
  "main": "lib/index.js",
  "files": [
    "LIB/index.js",
    ~~~~~~~~~~~~~~
    Declaring "LIB/index.js" in \`files\` is unnecessary; it is already the \`main\` entry.
    "dist/"
  ]
}
`,
			suggestions: [
				{
					id: "removeFilesEntry",
					updated: `
{
  "main": "lib/index.js",
  "files": [
    "dist/"
  ]
}
`,
				},
			],
		},
		{
			code: `
{
  "bin": "./bin/run.js",
  "files": [
    "BIN/run.js",
    "dist/"
  ]
}
`,
			snapshot: `
{
  "bin": "./bin/run.js",
  "files": [
    "BIN/run.js",
    ~~~~~~~~~~~~
    Declaring "BIN/run.js" in \`files\` is unnecessary; it is already included via \`bin\`.
    "dist/"
  ]
}
`,
			suggestions: [
				{
					id: "removeFilesEntry",
					updated: `
{
  "bin": "./bin/run.js",
  "files": [
    "dist/"
  ]
}
`,
				},
			],
		},
		{
			code: `
{
  "files": [
    "readme.md",
    "dist/"
  ]
}
`,
			snapshot: `
{
  "files": [
    "readme.md",
    ~~~~~~~~~~~
    Declaring "readme.md" in \`files\` is unnecessary; it is included by default.
    "dist/"
  ]
}
`,
			suggestions: [
				{
					id: "removeFilesEntry",
					updated: `
{
  "files": [
    "dist/"
  ]
}
`,
				},
			],
		},
		{
			code: `
{
  "files": [
    "LICENSE",
    "dist/"
  ]
}
`,
			snapshot: `
{
  "files": [
    "LICENSE",
    ~~~~~~~~~
    Declaring "LICENSE" in \`files\` is unnecessary; it is included by default.
    "dist/"
  ]
}
`,
			suggestions: [
				{
					id: "removeFilesEntry",
					updated: `
{
  "files": [
    "dist/"
  ]
}
`,
				},
			],
		},
		{
			code: `
{
  "files": [
    "LICENCE",
    "dist/"
  ]
}
`,
			snapshot: `
{
  "files": [
    "LICENCE",
    ~~~~~~~~~
    Declaring "LICENCE" in \`files\` is unnecessary; it is included by default.
    "dist/"
  ]
}
`,
			suggestions: [
				{
					id: "removeFilesEntry",
					updated: `
{
  "files": [
    "dist/"
  ]
}
`,
				},
			],
		},
		{
			code: `
{
  "files": [
    "package.json",
    "dist/"
  ]
}
`,
			snapshot: `
{
  "files": [
    "package.json",
    ~~~~~~~~~~~~~~
    Declaring "package.json" in \`files\` is unnecessary; it is included by default.
    "dist/"
  ]
}
`,
			suggestions: [
				{
					id: "removeFilesEntry",
					updated: `
{
  "files": [
    "dist/"
  ]
}
`,
				},
			],
		},
	],
	valid: [
		`{}`,
		`
{
  "bin": "./bin/run.js",
  "files": ["dist/"]
}
`,
		`
{
  "main": "dist/index.js",
  "files": ["dist/*"]
}
`,
		`
{
  "files": ["CHANGELOG.md", "dist/"]
}
`,
		`
{
  "files": "dist/"
}
`,
	],
});
