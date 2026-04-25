import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.mainPresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`main\` is expected to be present.
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
Property \`main\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "main": {}
}`,
	],
});
