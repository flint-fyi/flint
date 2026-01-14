import rule from "./definitionDuplicates.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
[mercury]: https://example.com/mercury
[mercury]: https://example.com/venus
`,
			snapshot: `
[mercury]: https://example.com/mercury
[mercury]: https://example.com/venus
~~~~~~~~~
This definition identifier 'mercury' is already defined.
`,
		},
		{
			code: `
[earth]: https://example.com/earth
[Earth]: https://example.com/mars
`,
			snapshot: `
[earth]: https://example.com/earth
[Earth]: https://example.com/mars
~~~~~~~
This definition identifier 'earth' is already defined.
`,
		},
		{
			code: `
[venus]: https://example.com/venus
[mars]: https://example.com/mars
[venus]: https://example.com/jupiter
`,
			snapshot: `
[venus]: https://example.com/venus
[mars]: https://example.com/mars
[venus]: https://example.com/jupiter
~~~~~~~
This definition identifier 'venus' is already defined.
`,
		},
		{
			code: `
[first]: https://example.com/1
[second]: https://example.com/2
[FIRST]: https://example.com/3
`,
			snapshot: `
[first]: https://example.com/1
[second]: https://example.com/2
[FIRST]: https://example.com/3
~~~~~~~
This definition identifier 'first' is already defined.
`,
		},
	],
	valid: [
		`[mercury]: https://example.com/mercury`,
		`[venus]: https://example.com/venus`,
		`
[mercury]: https://example.com/mercury
[venus]: https://example.com/venus
`,
		`
[earth]: https://example.com/earth
[mars]: https://example.com/mars
[jupiter]: https://example.com/jupiter
`,
		`[//]: # (This is a comment 1)
[//]: <> (This is a comment 2)`,
		`
[docs]: https://docs.example.com
[guide]: https://guide.example.com

See the [docs][] and [guide][].
`,
	],
});
