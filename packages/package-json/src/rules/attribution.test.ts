import { ruleTester } from "../ruleTester.ts";
import rule from "./attribution.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
}
`,
			snapshot: `
{
~
Package attribution is expected to include an author or contributors.
}
`,
		},
		{
			code: `
{
  "contributors": []
}
`,
			snapshot: `
{
  "contributors": []
                  ~~
                  Contributors are expected to include at least one entry.
}
`,
		},
		{
			code: `
{
  "author": "Flint",
  "contributors": [
    "Alan"
  ]
}
`,
			options: { preferContributorsOnly: true },
			snapshot: `
{
  "author": "Flint",
  ~~~~~~~~
  Prefer using contributors over author for package attribution.
  "contributors": [
    "Alan"
  ]
}
`,
		},
		{
			code: `
{
  "author": "Flint"
}
`,
			options: { preferContributorsOnly: true },
			snapshot: `
{
  "author": "Flint"
  ~~~~~~~~
  Prefer using contributors over author for package attribution.
}
`,
		},
		{
			code: `
{
  "author": "Flint",
  "contributors": []
}
`,
			options: { preferContributorsOnly: true },
			snapshot: `
{
  "author": "Flint",
  ~~~~~~~~
  Prefer using contributors over author for package attribution.
  "contributors": []
                  ~~
                  Contributors are expected to include at least one entry.
}
`,
		},
		{
			code: `
{
  "private": false
}
`,
			snapshot: `
{
~
Package attribution is expected to include an author or contributors.
  "private": false
}
`,
		},
		{
			code: `
{
}
`,
			options: { preferContributorsOnly: true },
			snapshot: `
{
~
Package attribution is expected to include contributors.
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
Package attribution is expected to include an author or contributors.
  "private": true
}
`,
		},
	],
	valid: [
		`{
  "author": "Flint"
}`,
		`{
  "contributors": ["Alan"]
}`,
		`{
  "author": "Flint",
  "contributors": ["Alan"]
}`,
		`{
  "private": true
}`,
		{
			code: `{
  "contributors": ["Alan"]
}`,
			options: { preferContributorsOnly: true },
		},
	],
});
