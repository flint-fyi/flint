import rule from "./importSelf.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
import foo from "./file";
`,
			fileName: "file.ts",
			snapshot: `
import foo from "./file";
                ~~~~~~~~
                Module imports itself.
`,
		},
		{
			code: `
import { value } from "./file";
`,
			fileName: "file.ts",
			snapshot: `
import { value } from "./file";
                      ~~~~~~~~
                      Module imports itself.
`,
		},
		{
			code: `
import * as mod from "./file";
`,
			fileName: "file.ts",
			snapshot: `
import * as mod from "./file";
                     ~~~~~~~~
                     Module imports itself.
`,
		},
	],
	valid: [
		{
			code: `import foo from "./other";`,
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
