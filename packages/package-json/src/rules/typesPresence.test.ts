import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.typesPresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`types\` is expected to be present.
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
Property \`types\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "types": "./index.d.ts"
}`,
	],
});
