import rule from "./definitionContents.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
[earth]: <>
`,
			snapshot: `
[earth]: <>
~~~~~~~~~~~
This definition has an empty URL.
`,
		},
		{
			code: `
[moon]: #
`,
			snapshot: `
[moon]: #
~~~~~~~~~
This definition has an empty URL.
`,
		},
		{
			code: `
Check out [Mercury][mercury]

[mercury]: <>
`,
			snapshot: `
Check out [Mercury][mercury]

[mercury]: <>
~~~~~~~~~~~~~
This definition has an empty URL.
`,
		},
		{
			code: `
[first]: https://example.com/first
[second]: #
[third]: https://example.com/third
`,
			snapshot: `
[first]: https://example.com/first
[second]: #
~~~~~~~~~~~
This definition has an empty URL.
[third]: https://example.com/third
`,
		},
	],
	valid: [
		`[earth]: https://example.com/earth/`,
		`[moon]: #section`,
		`
[mercury]: https://example.com/mercury/

Check out [Mercury][mercury]
`,
		`
[docs]: https://docs.example.com
[guide]: https://guide.example.com

See the [docs][] and [guide][].
`,
		`[//]: <> (This is a comment)`,
		`[//]: # (This is also a comment)`,
	],
});
