import rule from "./labelReferences.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
[Flint][flint]
`,
			snapshot: `
[Flint][flint]
 ~~~~~
 This label reference 'flint' has no definition.
`,
		},
		{
			code: `
[flint][]
`,
			snapshot: `
[flint][]
 ~~~~~
 This label reference 'flint' has no definition.
`,
		},
		{
			code: `
![Logo][logo]
`,
			snapshot: `
![Logo][logo]
  ~~~~
  This label reference 'logo' has no definition.
`,
		},
		{
			code: `
[Valid link][valid]

[valid]: https://example.com

[Missing link][missing]
`,
			snapshot: `
[Valid link][valid]

[valid]: https://example.com

[Missing link][missing]
 ~~~~~~~
 This label reference 'missing' has no definition.
`,
		},
	],
	valid: [
		`
[Flint][flint]

[flint]: https://eslint.org
`,
		`
[flint][]

[flint]: https://eslint.org
`,
		`
[flint]

[flint]: https://eslint.org
`,
		`
![Logo][logo]

[logo]: ./logo.png
`,
		`
[First][first]
[Second][second]

[first]: https://example.com/1
[second]: https://example.com/2
`,
		`
Check out [this link][ref] and ![this image][img].

[ref]: https://example.com
[img]: image.png
`,
		`
- List Item [abc123]
`,
	],
});
