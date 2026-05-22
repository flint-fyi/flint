import { ruleTester } from "../ruleTester.ts";
import rule from "./privatePackageProperties.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
    "private": true,
    "files": ["lib"]
}
`,
			snapshot: `
{
    "private": true,
    "files": ["lib"]
    ~~~~~~~
    Private packages do not need the \`files\` property.
}
`,
			suggestions: [
				{
					id: "removePrivatePackageProperty",
					updated: `
{
    "private": true
}
`,
				},
			],
		},
		{
			code: `
{
    "private": true,
    "publishConfig": {
        "access": "public"
    }
}
`,
			snapshot: `
{
    "private": true,
    "publishConfig": {
    ~~~~~~~~~~~~~~~
    Private packages do not need the \`publishConfig\` property.
        "access": "public"
    }
}
`,
			suggestions: [
				{
					id: "removePrivatePackageProperty",
					updated: `
{
    "private": true
}
`,
				},
			],
		},
		{
			code: `
{
    "private": true,
    "sideEffects": false
}
`,
			options: {
				blockedProperties: ["sideEffects"],
			},
			snapshot: `
{
    "private": true,
    "sideEffects": false
    ~~~~~~~~~~~~~
    Private packages do not need the \`sideEffects\` property.
}
`,
			suggestions: [
				{
					id: "removePrivatePackageProperty",
					updated: `
{
    "private": true
}
`,
				},
			],
		},
		{
			code: `
{
    "files": [],
    "private": true
}
`,
			snapshot: `
{
    "files": [],
    ~~~~~~~
    Private packages do not need the \`files\` property.
    "private": true
}
`,
			suggestions: [
				{
					id: "removePrivatePackageProperty",
					updated: `
{
    "private": true
}
`,
				},
			],
		},
	],
	valid: [
		`{}`,
		`{
    "private": false,
    "files": ["lib"],
    "publishConfig": {
        "access": "public"
    }
}`,
		`{
    "private": true
}`,
		`{
    "private": true,
    "sideEffects": false
}`,
		{
			code: `{
    "private": true,
    "files": ["lib"]
}`,
			options: {
				blockedProperties: ["publishConfig"],
			},
		},
	],
});
