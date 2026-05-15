import { ruleTester } from "../ruleTester.ts";
import rule from "./exportsSubpathsStyle.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
    "exports": "./index.js"
}
`,
			output: `
{
    "exports": { ".": "./index.js" }
}
`,
			snapshot: `
{
    "exports": "./index.js"
    ~~~~~~~~~
    Prefer the explicit "." subpath form for a single package export.
}
`,
		},
		{
			code: `
{
    "exports": {
        "import": "./index.mjs",
        "require": "./index.cjs"
    }
}
`,
			output: `
{
    "exports": { ".": {
        "import": "./index.mjs",
        "require": "./index.cjs"
    } }
}
`,
			snapshot: `
{
    "exports": {
    ~~~~~~~~~
    Prefer the explicit "." subpath form for a single package export.
        "import": "./index.mjs",
        "require": "./index.cjs"
    }
}
`,
		},
		{
			code: `
{
    "exports": {
        ".": "./index.js"
    }
}
`,
			options: { prefer: "implicit" },
			output: `
{
    "exports": "./index.js"
}
`,
			snapshot: `
{
    "exports": {
    ~~~~~~~~~
    Prefer the implicit root form for a single package export.
        ".": "./index.js"
    }
}
`,
		},
		{
			code: `
{
    "exports": {
        ".": {
            "import": "./index.mjs",
            "require": "./index.cjs"
        }
    }
}
`,
			options: { prefer: "implicit" },
			output: `
{
    "exports": {
            "import": "./index.mjs",
            "require": "./index.cjs"
        }
}
`,
			snapshot: `
{
    "exports": {
    ~~~~~~~~~
    Prefer the implicit root form for a single package export.
        ".": {
            "import": "./index.mjs",
            "require": "./index.cjs"
        }
    }
}
`,
		},
	],
	valid: [
		`{}`,
		`{ "exports": null }`,
		`{ "exports": 123 }`,
		{
			code: `{ "exports": "./index.js" }`,
			options: { prefer: "implicit" },
		},
		{
			code: `
{
    "exports": {
        "import": "./index.mjs",
        "require": "./index.cjs"
    }
}
`,
			options: { prefer: "implicit" },
		},
		`
{
    "exports": {
        ".": "./index.js"
    }
}
`,
		`
{
    "exports": {
        ".": "./index.js",
        "./utils": "./utils.js"
    }
}
`,
		{
			code: `
{
    "exports": {
        ".": "./index.js",
        "./utils": "./utils.js"
    }
}
`,
			options: { prefer: "implicit" },
		},
	],
});
