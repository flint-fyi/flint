import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.publishConfigPresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`publishConfig\` is expected to be present.
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
Property \`publishConfig\` is expected to be present.
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
Property \`publishConfig\` is expected to be present.
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
Property \`publishConfig\` is expected to be present.
  "private": true
}
`,
		},
	],
	valid: [
		`{
  "publishConfig": {}
}`,
		{
			code: `{
  "private": true
}`,
			options: { ignorePrivate: true },
		},
	],
});
