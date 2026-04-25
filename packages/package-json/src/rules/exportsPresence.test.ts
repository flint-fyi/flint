import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.exportsPresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`exports\` is expected to be present.
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
Property \`exports\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "exports": {}
}`,
	],
});
