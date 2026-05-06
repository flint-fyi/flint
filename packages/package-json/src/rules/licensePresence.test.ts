import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.licensePresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`license\` is expected to be present.
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
Property \`license\` is expected to be present.
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
Property \`license\` is expected to be present.
  "private": true
}
`,
		},
	],
	valid: [
		`{
  "license": {}
}`,
		`{
  "private": true
}`,
	],
});
