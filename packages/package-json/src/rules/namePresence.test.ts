import { directPropertyPresenceRules } from "../directPropertyPresenceRules.ts";
import { ruleTester } from "../ruleTester.ts";

ruleTester.describe(directPropertyPresenceRules.namePresence, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Property \`name\` is expected to be present.
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
Property \`name\` is expected to be present.
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
Property \`name\` is expected to be present.
  "private": true
}
`,
		},
	],
	valid: [
		`{
  "name": "my-repository"
}`,
		`{
  "private": true
}`,
	],
});
