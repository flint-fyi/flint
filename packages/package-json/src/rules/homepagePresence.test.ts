import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.homepagePresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`homepage\` is expected to be present.
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
Property \`homepage\` is expected to be present.
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
Property \`homepage\` is expected to be present.
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
Property \`homepage\` is expected to be present.
  "private": true
}
`,
		},
	],
	valid: [
		`{
  "homepage": {}
}`,
		{
			code: `{
  "private": true
}`,
			options: { ignorePrivate: true },
		},
	],
});
