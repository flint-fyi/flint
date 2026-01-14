import rule from "./definitionUses.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
[mercury]: https://example.com/mercury
`,
			snapshot: `
[mercury]: https://example.com/mercury
~~~~~~~~~
This definition 'mercury' is never used.
`,
		},
		{
			code: `
[venus]: https://example.com/venus.jpg
`,
			snapshot: `
[venus]: https://example.com/venus.jpg
~~~~~~~
This definition 'venus' is never used.
`,
		},
		{
			code: `
[mercury]: https://example.com/mercury

[Mercury][mercury]

[venus]: https://example.com/venus
`,
			snapshot: `
[mercury]: https://example.com/mercury

[Mercury][mercury]

[venus]: https://example.com/venus
~~~~~~~
This definition 'venus' is never used.
`,
		},
		{
			code: `
![Earth Image][earth]

[earth]: https://example.com/earth.jpg
[mars]: https://example.com/mars.jpg
`,
			snapshot: `
![Earth Image][earth]

[earth]: https://example.com/earth.jpg
[mars]: https://example.com/mars.jpg
~~~~~~
This definition 'mars' is never used.
`,
		},
	],
	valid: [
		`
[Mercury][mercury]

[mercury]: https://example.com/mercury
`,
		`
![Venus Image][venus]

[venus]: https://example.com/venus.jpg
`,
		`
[Mercury][mercury]

[mercury]: https://example.com/mercury

![Venus Image][venus]

[venus]: https://example.com/venus.jpg
`,
		`
See [docs][] and [guide][].

[docs]: https://docs.example.com
[guide]: https://guide.example.com
`,
		`[//]: # (This is a comment 1)
[//]: <> (This is a comment 2)`,
		`
Check out [Earth][earth] and ![Mars][mars].

[earth]: https://example.com/earth
[mars]: https://example.com/mars.jpg
`,
	],
});
