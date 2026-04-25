import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.authorPresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`author\` is expected to be present.
}
`,
		},
		{
			code: `
{
  "other": true
}
`,
			snapshot: `
{
~
Property \`author\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "author": "Name"
}`,
	],
});
