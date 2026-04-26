import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.workspacesPresence, {
	invalid: [
		{
			code: `{
}
`,
			snapshot: `{
~
Property \`workspaces\` is expected to be present.
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
Property \`workspaces\` is expected to be present.
  "other": true
}
`,
		},
	],
	valid: [
		`{
  "workspaces": ["packages/a"]
}`,
	],
});
