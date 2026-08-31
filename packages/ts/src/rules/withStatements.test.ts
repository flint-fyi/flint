import { createRuleTesterTSConfig } from "@flint.fyi/typescript-language";

import { ruleTester } from "./ruleTester.ts";
import rule from "./withStatements.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
with (container.property) {
  property.value = true;
}
`,
			fileName: "file.js",
			files: createRuleTesterTSConfig({
				allowJs: true,
				checkJs: false,
				noEmit: true,
				noUnusedLocals: false,
			}),
			snapshot: `
with (container.property) {
~~~~
\`with\` statements are deprecated, unreliable, and difficult to reason about.
  property.value = true;
}
`,
		},
	],
	valid: [
		`
const container = { property: { value: false } };

let property = container.property;
property.value = true;
`,
	],
});
