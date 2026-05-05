import { ruleTester } from "../ruleTester.ts";
import rule from "./scriptsNameCasing.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
	"scripts": {
		"invalidKey": "flint"
	}
}
`,
			snapshot: `
{
	"scripts": {
		"invalidKey": "flint"
		~~~~~~~~~~~~
		Prefer the standard kebab-case style for \`scripts\` names (optionally with \`:\` separators).
	}
}
`,
			suggestions: [
				{
					id: "convertToKebabCase",
					updated: `
{
	"scripts": {
		"invalid-key": "flint"
	}
}
`,
				},
			],
		},
		{
			code: `
{
	"scripts": {
		"valid-key": "./scripts/valid.js",
		"anotherInvalidKey": "./scripts/invalid.js"
	}
}
`,
			snapshot: `
{
	"scripts": {
		"valid-key": "./scripts/valid.js",
		"anotherInvalidKey": "./scripts/invalid.js"
		~~~~~~~~~~~~~~~~~~~
		Prefer the standard kebab-case style for \`scripts\` names (optionally with \`:\` separators).
	}
}
`,
			suggestions: [
				{
					id: "convertToKebabCase",
					updated: `
{
	"scripts": {
		"valid-key": "./scripts/valid.js",
		"another-invalid-key": "./scripts/invalid.js"
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
	"scripts": "flint"
}
`,
		`
{
	"scripts": {
		"valid-key": "flint"
	}
}
`,
		`
{
	"scripts": {
		"valid:key": "flint"
	}
}
`,
		`
{
	"scripts": {
		"valid:nested:key": "flint"
	}
}
`,
		`
{
	"scripts": null
}
`,
		`
{
	"scripts": []
}
`,
	],
});
