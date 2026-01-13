import rule from "./labelReferenceValidity.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
[flint][ ]
`,
			snapshot: `
[flint][ ]
~~~~~~~~~~
This label reference has invalid whitespace between brackets.
`,
		},
		{
			code: `
[flint][
]
`,
			snapshot: `
[flint][
~~~~~~~~
This label reference has invalid whitespace between brackets.
]
~
`,
		},
		{
			code: `
[link][  ]
`,
			snapshot: `
[link][  ]
~~~~~~~~~~
This label reference has invalid whitespace between brackets.
`,
		},
		{
			code: `
Check out [Flint][ ] for more info.
`,
			snapshot: `
Check out [Flint][ ] for more info.
          ~~~~~~~~~~
          This label reference has invalid whitespace between brackets.
`,
		},
	],
	valid: [
		`[flint][]`,
		`[flint][flint]`,
		`
[flint][]

[flint]: https://eslint.org
`,
		`
[link][ref]

[ref]: https://example.com
`,
		`
Check out [fLint][] for more info.

[flint]: https://eslint.org
`,
		`[valid]`,
	],
});
