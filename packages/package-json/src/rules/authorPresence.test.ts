import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.authorPresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`author\` is expected to be present.
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
Property \`author\` is expected to be present.
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
Property \`author\` is expected to be present.
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
Property \`author\` is expected to be present.
  "private": true
}
`,
		},
	],
	valid: [
		`{
  "author": "Name"
}`,
		{
			code: `{
  "private": true
}`,
			options: { ignorePrivate: true },
		},
	],
});
