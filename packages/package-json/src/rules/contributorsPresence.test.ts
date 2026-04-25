import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.contributorsPresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`contributors\` is expected to be present.
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
Property \`contributors\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "contributors": {}
}`,
	],
});
