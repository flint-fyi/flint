import rule from "./importSelf.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import all from "./file";
`,
			fileName: "file.ts",
			snapshot: `
import all from "./file";
                ~~~~~~~~
                This module imports itself.
`,
			suggestions: [
				{
					id: "removeSelfImport",
					updated: `

`,
				},
			],
		},
		{
			code: `
import { value } from "./file";
`,
			fileName: "file.ts",
			snapshot: `
import { value } from "./file";
                      ~~~~~~~~
                      This module imports itself.
`,
			suggestions: [
				{
					id: "removeSelfImport",
					updated: `

`,
				},
			],
		},
		{
			code: `
import * as mod from "./file";
`,
			fileName: "file.ts",
			snapshot: `
import * as mod from "./file";
                     ~~~~~~~~
                     This module imports itself.
`,
			suggestions: [
				{
					id: "removeSelfImport",
					updated: `

`,
				},
			],
		},
	],
	valid: [
		{
			code: `import other from "./other";`,
			fileName: "file.ts",
		},
		{
			code: `import { value } from "./other";`,
			fileName: "file.ts",
		},
		{
			code: `import "some-side-effect-module";`,
			fileName: "file.ts",
		},
	],
});
