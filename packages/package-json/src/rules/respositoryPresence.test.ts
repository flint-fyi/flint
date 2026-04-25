import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.repositoryPresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`repository\` is expected to be present.
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
Property \`repository\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "repository": {}
}`,
	],
});
