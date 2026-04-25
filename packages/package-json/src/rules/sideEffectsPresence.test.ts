import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.sideEffectsPresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`sideEffects\` is expected to be present.
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
Property \`sideEffects\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "sideEffects": true
}`,
	],
});
