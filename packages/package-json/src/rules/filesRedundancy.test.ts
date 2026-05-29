import { ruleTester } from "../ruleTester.ts";
import filesRedundancy from "./filesRedundancy.ts";

ruleTester.describe(filesRedundancy, {
	invalid: [
		{
			code: `
{
  "files": ["CHANGELOG.md", "lib/index.js"],
  "main": "lib/index.js"
}
`,
			snapshot: `
{
  "files": ["CHANGELOG.md", "lib/index.js"],
                            ~~~~~~~~~~~~~~
                            Explicitly declaring "lib/index.js" in \`files\` is unnecessary; it's the \`main\` entry.
  "main": "lib/index.js"
}
`,
			suggestions: [
				{
					id: "removeDuplicateFile",
					updated: `
{
  "files": ["CHANGELOG.md"],
  "main": "lib/index.js"
}
`,
				},
			],
		},
		{
			code: `
{
  "files": ["CHANGELOG.md", "./lib/index.js"],
  "main": "lib/index.js"
}
`,
			snapshot: `
{
  "files": ["CHANGELOG.md", "./lib/index.js"],
                            ~~~~~~~~~~~~~~~~
                            Explicitly declaring "./lib/index.js" in \`files\` is unnecessary; it's the \`main\` entry.
  "main": "lib/index.js"
}
`,
			suggestions: [
				{
					id: "removeDuplicateFile",
					updated: `
{
  "files": ["CHANGELOG.md"],
  "main": "lib/index.js"
}
`,
				},
			],
		},
		{
			code: `
{
  "files": ["CHANGELOG.md", "README.md"]
}
`,
			snapshot: `
{
  "files": ["CHANGELOG.md", "README.md"]
                            ~~~~~~~~~~~
                            Explicitly declaring "README.md" in \`files\` is unnecessary; it's included by default.
}
`,
			suggestions: [
				{
					id: "removeDuplicateFile",
					updated: `
{
  "files": ["CHANGELOG.md"]
}
`,
				},
			],
		},
		{
			code: `
{
  "files": ["CHANGELOG.md", "readMe.MD"]
}
`,
			snapshot: `
{
  "files": ["CHANGELOG.md", "readMe.MD"]
                            ~~~~~~~~~~~
                            Explicitly declaring "readMe.MD" in \`files\` is unnecessary; it's included by default.
}
`,
			suggestions: [
				{
					id: "removeDuplicateFile",
					updated: `
{
  "files": ["CHANGELOG.md"]
}
`,
				},
			],
		},
		{
			code: `
{
  "files": ["CHANGELOG.md", "lib/index.js"],
  "bin": "lib/index.js"
}
`,
			snapshot: `
{
  "files": ["CHANGELOG.md", "lib/index.js"],
                            ~~~~~~~~~~~~~~
                            Explicitly declaring "lib/index.js" in \`files\` is unnecessary; it's included in \`bin\`.
  "bin": "lib/index.js"
}
`,
			suggestions: [
				{
					id: "removeDuplicateFile",
					updated: `
{
  "files": ["CHANGELOG.md"],
  "bin": "lib/index.js"
}
`,
				},
			],
		},
		{
			code: `
{
  "files": ["CHANGELOG.md", "lib/index.js"],
  "bin": "./lib/index.js"
}
`,
			snapshot: `
{
  "files": ["CHANGELOG.md", "lib/index.js"],
                            ~~~~~~~~~~~~~~
                            Explicitly declaring "lib/index.js" in \`files\` is unnecessary; it's included in \`bin\`.
  "bin": "./lib/index.js"
}
`,
			suggestions: [
				{
					id: "removeDuplicateFile",
					updated: `
{
  "files": ["CHANGELOG.md"],
  "bin": "./lib/index.js"
}
`,
				},
			],
		},
		{
			code: `
{
  "files": ["CHANGELOG.md", "lib/index.js"],
  "bin": { "my-cli": "lib/index.js" }
}
`,
			snapshot: `
{
  "files": ["CHANGELOG.md", "lib/index.js"],
                            ~~~~~~~~~~~~~~
                            Explicitly declaring "lib/index.js" in \`files\` is unnecessary; it's included in \`bin\`.
  "bin": { "my-cli": "lib/index.js" }
}
`,
			suggestions: [
				{
					id: "removeDuplicateFile",
					updated: `
{
  "files": ["CHANGELOG.md"],
  "bin": { "my-cli": "lib/index.js" }
}
`,
				},
			],
		},
		{
			code: `
{
  "files": ["CHANGELOG.md", "lib/index.js"],
  "bin": { "my-cli": "lib/index.js" }
}
`,
			snapshot: `
{
  "files": ["CHANGELOG.md", "lib/index.js"],
                            ~~~~~~~~~~~~~~
                            Explicitly declaring "lib/index.js" in \`files\` is unnecessary; it's included in \`bin\`.
  "bin": { "my-cli": "lib/index.js" }
}
`,
			suggestions: [
				{
					id: "removeDuplicateFile",
					updated: `
{
  "files": ["CHANGELOG.md"],
  "bin": { "my-cli": "lib/index.js" }
}
`,
				},
			],
		},
		{
			code: `
{
  "files": ["CHANGELOG.md", "lib/index.js", "lib/index.js"]
}
`,
			snapshot: `
{
  "files": ["CHANGELOG.md", "lib/index.js", "lib/index.js"]
                                            ~~~~~~~~~~~~~~
                                            \`files\` has more than one entry for "lib/index.js".
}
`,
			suggestions: [
				{
					id: "removeDuplicateFile",
					updated: `
{
  "files": ["CHANGELOG.md", "lib/index.js"]
}
`,
				},
			],
		},
	],
	valid: [
		`{}`,
		`{
  "files": []
}`,
		`{
  "files": ["CHANGELOG.md", "lib/index.js"]
}`,
	],
});
