import rule from "./fileExtensions.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
`,
			fileName: "config.yml",
			snapshot: `

Use .yaml extension instead of .yml for YAML files.
`,
		},
		{
			code: `
key: value
`,
			fileName: "config.yml",
			snapshot: `
key: value
~
Use .yaml extension instead of .yml for YAML files.
`,
		},
		{
			code: `
name: test
`,
			fileName: "settings.YML",
			snapshot: `
name: test
~
Use .yaml extension instead of .yml for YAML files.
`,
		},
	],
	valid: [
		{ code: `key: value`, fileName: "config.yaml" },
		{ code: `name: test`, fileName: "settings.YAML" },
	],
});
