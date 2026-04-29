import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.gypfilePresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`gypfile\` is expected to be present.
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
Property \`gypfile\` is expected to be present.
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
Property \`gypfile\` is expected to be present.
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
Property \`gypfile\` is expected to be present.
  "private": true
}
`,
		},
	],
	valid: [
		`{
  "gypfile": {}
}`,
		{
			code: `{
  "private": true
}`,
			options: { ignorePrivate: true },
		},
	],
});
