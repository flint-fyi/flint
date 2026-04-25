import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.dependenciesPresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`dependencies\` is expected to be present.
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
Property \`dependencies\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "dependencies": {}
}`,
	],
});
