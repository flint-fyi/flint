import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.binPresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`bin\` is expected to be present.
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
Property \`bin\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "bin": "https://example.com"
}`,
	],
});
