import rule from "./fileExtensions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			files: {
				"config.yml": `
`,
			},
			snapshot: `

Use .yaml extension instead of .yml for YAML files.
`,
		},
		{
			files: {
				"config.yml": `
key: value
`,
			},
			snapshot: `
key: value
~
Use .yaml extension instead of .yml for YAML files.
`,
		},
		{
			files: {
				"settings.YML": `
name: test
`,
			},
			snapshot: `
name: test
~
Use .yaml extension instead of .yml for YAML files.
`,
		},
	],
	valid: [
		{
			files: {
				"config.yaml": `key: value`,
			},
		},
		{
			files: {
				"settings.YAML": `name: test`,
			},
		},
	],
});
