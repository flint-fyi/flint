import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.devDependenciesPresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`devDependencies\` is expected to be present.
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
Property \`devDependencies\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "devDependencies": {}
}`,
	],
});
