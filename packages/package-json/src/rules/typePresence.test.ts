import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.typePresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`type\` is expected to be present.
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
Property \`type\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "type": "module"
}`,
	],
});
