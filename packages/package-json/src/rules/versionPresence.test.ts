import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.versionPresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`version\` is expected to be present.
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
Property \`version\` is expected to be present.
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
Property \`version\` is expected to be present.
  "private": true
}
`,
		},
	],
	valid: [
		`{
  "version": "0.0.0"
}`,
		`{
  "private": true
}
`,
	],
});
