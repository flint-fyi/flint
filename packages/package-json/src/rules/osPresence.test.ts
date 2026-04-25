import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.osPresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`os\` is expected to be present.
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
Property \`os\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "os": {}
}`,
	],
});
