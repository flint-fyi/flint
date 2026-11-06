import { javascriptRuleTester, ruleTester } from "./ruleTester.ts";
import rule from "./withStatements.ts";

javascriptRuleTester.describe(rule, {
	invalid: [
		{
			files: {
				"file.js": `
with (container.property) {
  property.value = true;
}
`,
			},
			snapshot: {
				"file.js": `
with (container.property) {
~~~~
\`with\` statements are deprecated, unreliable, and difficult to reason about.
  property.value = true;
}
`,
			},
		},
	],
	valid: [],
});

ruleTester.describe(rule, {
	invalid: [],
	valid: [
		`
const container = { property: { value: false } };

let property = container.property;
property.value = true;
`,
	],
});
