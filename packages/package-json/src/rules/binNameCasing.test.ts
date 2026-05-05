import { ruleTester } from "../ruleTester.ts";
import rule from "./binNameCasing.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
	"bin": {
		"invalidCommand": "./bin/cli.js"
	}
}
`,
			snapshot: `
{
	"bin": {
		"invalidCommand": "./bin/cli.js"
		~~~~~~~~~~~~~~~~
		Prefer the standard kebab-case style for \`bin\` commands.
	}
}
`,
			suggestions: [
				{
					id: "convertToKebabCase",
					updated: `
{
	"bin": {
		"invalid-command": "./bin/cli.js"
	}
}
`,
				},
			],
		},
		{
			code: `
{
	"bin": {
		"valid-command": "./bin/valid.js",
		"anotherInvalidCommand": "./bin/invalid.js"
	}
}
`,
			snapshot: `
{
	"bin": {
		"valid-command": "./bin/valid.js",
		"anotherInvalidCommand": "./bin/invalid.js"
		~~~~~~~~~~~~~~~~~~~~~~~
		Prefer the standard kebab-case style for \`bin\` commands.
	}
}
`,
			suggestions: [
				{
					id: "convertToKebabCase",
					updated: `
{
	"bin": {
		"valid-command": "./bin/valid.js",
		"another-invalid-command": "./bin/invalid.js"
	}
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
	"bin": "./bin/cli.js"
}
`,
		`
{
	"bin": {
		"valid-command": "./bin/cli.js"
	}
}
`,
		`
{
	"bin": null
}
`,
		`
{
	"bin": []
}
`,
		`
{
	"scripts": {
		"invalidCommand": "node ./script.js"
	}
}
`,
	],
});
