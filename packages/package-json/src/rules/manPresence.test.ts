import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.manPresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`man\` is expected to be present.
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
Property \`man\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "man": {}
}`,
	],
});
