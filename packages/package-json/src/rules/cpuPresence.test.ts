import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.cpuPresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`cpu\` is expected to be present.
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
Property \`cpu\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "cpu": {}
}`,
	],
});
