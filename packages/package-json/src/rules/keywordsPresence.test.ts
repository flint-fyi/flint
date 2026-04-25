import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.keywordsPresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`keywords\` is expected to be present.
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
Property \`keywords\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "keywords": {}
}`,
	],
});
