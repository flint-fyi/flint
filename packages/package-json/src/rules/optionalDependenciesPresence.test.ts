import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.optionalDependenciesPresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`optionalDependencies\` is expected to be present.
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
Property \`optionalDependencies\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "optionalDependencies": {}
}`,
	],
});
