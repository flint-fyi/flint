import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.peerDependenciesPresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`peerDependencies\` is expected to be present.
}
`,
		},
		{
			code: `
{
  "other": true
}
`,
			snapshot: `
{
~
Property \`peerDependencies\` is expected to be present.
  "other": true
}
`,
		},
		{
			code: `
{
  "private": true
}
`,
			options: { ignorePrivate: false },
			snapshot: `
{
~
Property \`peerDependencies\` is expected to be present.
  "private": true
}
`,
		},
		{
			code: `
{
  "private": true
}
`,
			snapshot: `
{
~
Property \`peerDependencies\` is expected to be present.
  "private": true
}
`,
		},
	],
	valid: [
		`{
  "peerDependencies": {}
}`,
		{
			code: `{
  "private": true
}`,
			options: { ignorePrivate: true },
		},
	],
});
