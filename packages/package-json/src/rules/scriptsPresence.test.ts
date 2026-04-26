import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.scriptsPresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`scripts\` is expected to be present.
}
`,
		},
		{
			code: `{
  "other": true
}
`,
			snapshot: `{
~
Property \`scripts\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "scripts": {}
}`,
	],
});
