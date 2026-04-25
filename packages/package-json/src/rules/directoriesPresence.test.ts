import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.directoriesPresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`directories\` is expected to be present.
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
Property \`directories\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "directories": {}
}`,
	],
});
