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
let property = container.property;
property.value = true;
`,
	],
});
