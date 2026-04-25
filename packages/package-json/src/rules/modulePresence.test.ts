import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.modulePresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`module\` is expected to be present.
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
Property \`module\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "module": {}
}`,
	],
});
