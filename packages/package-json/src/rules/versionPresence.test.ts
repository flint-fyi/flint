import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.versionPresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`version\` is expected to be present.
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
Property \`version\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "version": "0.0.0"
}`,
	],
});
