import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.peerDependenciesMetaPresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`peerDependenciesMeta\` is expected to be present.
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
Property \`peerDependenciesMeta\` is expected to be present.
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
Property \`peerDependenciesMeta\` is expected to be present.
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
Property \`peerDependenciesMeta\` is expected to be present.
  "private": true
}
`,
		},
	],
	valid: [
		`{
  "peerDependenciesMeta": {}
}`,
		{
			code: `{
  "private": true
}`,
			options: { ignorePrivate: true },
		},
	],
});
