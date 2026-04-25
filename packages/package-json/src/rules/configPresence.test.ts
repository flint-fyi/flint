import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.configPresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`config\` is expected to be present.
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
Property \`config\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "config": {}
}`,
	],
});
