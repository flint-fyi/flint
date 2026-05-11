import { ruleTester } from "../ruleTester.ts";
import rule from "./emptyFields.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
    "main": "./lib/index.js",
    "scripts": {}
}
`,
			snapshot: `
{
    "main": "./lib/index.js",
    "scripts": {}
    ~~~~~~~~~
    This empty field does not add package metadata.
}
`,
			suggestions: [
				{
					id: "removeEmptyField",
					updated: `
{
    "main": "./lib/index.js"
}
`,
				},
			],
		},
		{
			code: `
{
    "main": "./lib/index.js",
    "simple-git-hooks": {
        "pre-commit": "pnpm exec nano-staged",
        "preserveUnused": []
    }
}
`,
			snapshot: `
{
    "main": "./lib/index.js",
    "simple-git-hooks": {
        "pre-commit": "pnpm exec nano-staged",
        "preserveUnused": []
        ~~~~~~~~~~~~~~~~
        This empty field does not add package metadata.
    }
}
`,
			suggestions: [
				{
					id: "removeEmptyField",
					updated: `
{
    "main": "./lib/index.js",
    "simple-git-hooks": {
        "pre-commit": "pnpm exec nano-staged"
    }
}
`,
				},
			],
		},
		{
			code: `
{
    "workspaces": [
        {},
        {
            "packages": ["packages/*"]
        }
    ]
}
`,
			snapshot: `
{
    "workspaces": [
        {},
        ~~
        This empty element does not add package metadata.
        {
            "packages": ["packages/*"]
        }
    ]
}
`,
			suggestions: [
				{
					id: "removeEmptyField",
					updated: `
{
    "workspaces": [
        {
            "packages": ["packages/*"]
        }
    ]
}
`,
				},
			],
		},
		{
			code: `
{
    "files": [],
    "browserslist": []
}
`,
			options: {
				ignoreProperties: ["browserslist"],
			},
			snapshot: `
{
    "files": [],
    ~~~~~~~
    This empty field does not add package metadata.
    "browserslist": []
}
`,
			suggestions: [
				{
					id: "removeEmptyField",
					updated: `
{
    "browserslist": []
}
`,
				},
			],
		},
		{
			code: `
{
    "scripts": {}
}
`,
			snapshot: `
{
    "scripts": {}
    ~~~~~~~~~
    This empty field does not add package metadata.
}
`,
			suggestions: [
				{
					id: "removeEmptyField",
					updated: `
{}
`,
				},
			],
		},
		{
			code: `
{
    "config": {
        "nested": {}
    }
}
`,
			snapshot: `
{
    "config": {
        "nested": {}
        ~~~~~~~~
        This empty field does not add package metadata.
    }
}
`,
			suggestions: [
				{
					id: "removeEmptyField",
					updated: `
{
    "config": {}
}
`,
				},
			],
		},
		{
			code: `
{
    "workspaces": [[], "packages/*"]
}
`,
			snapshot: `
{
    "workspaces": [[], "packages/*"]
                   ~~
                   This empty element does not add package metadata.
}
`,
			suggestions: [
				{
					id: "removeEmptyField",
					updated: `
{
    "workspaces": ["packages/*"]
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
    "files": []
}
`,
		{
			code: `
{
    "browserslist": []
}
`,
			options: {
				ignoreProperties: ["browserslist"],
			},
		},
		`
{
    "main": "./lib/index.js",
    "scripts": {
        "test": "vitest"
    }
}
`,
	],
});
