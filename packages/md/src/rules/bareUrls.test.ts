import rule from "./bareUrls.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
For more info, visit https://www.example.com
`,
			snapshot: `
For more info, visit https://www.example.com
                     ~~~~~~~~~~~~~~~~~~~~~~~
                     This bare URL is ambiguous to parsers.
`,
			suggestions: [
				{
					id: "formatAsLink",
					updated: `
For more info, visit [https://www.example.com](https://www.example.com)
`,
				},
				{
					id: "wrapInAngleBrackets",
					updated: `
For more info, visit <https://www.example.com>
`,
				},
			],
		},
		{
			code: `
For more info, visit https://www.example.com/
`,
			snapshot: `
For more info, visit https://www.example.com/
                     ~~~~~~~~~~~~~~~~~~~~~~~~
                     This bare URL is ambiguous to parsers.
`,
			suggestions: [
				{
					id: "formatAsLink",
					updated: `
For more info, visit [https://www.example.com/](https://www.example.com/)
`,
				},
				{
					id: "wrapInAngleBrackets",
					updated: `
For more info, visit <https://www.example.com/>
`,
				},
			],
		},
		{
			code: `
Visit https://example.com for details.
`,
			snapshot: `
Visit https://example.com for details.
      ~~~~~~~~~~~~~~~~~~~
      This bare URL is ambiguous to parsers.
`,
			suggestions: [
				{
					id: "formatAsLink",
					updated: `
Visit [https://example.com](https://example.com) for details.
`,
				},
				{
					id: "wrapInAngleBrackets",
					updated: `
Visit <https://example.com> for details.
`,
				},
			],
		},
		{
			code: `
Multiple links: https://first.com and https://second.com
`,
			snapshot: `
Multiple links: https://first.com and https://second.com
                ~~~~~~~~~~~~~~~~~
                This bare URL is ambiguous to parsers.
                                      ~~~~~~~~~~~~~~~~~~
                                      This bare URL is ambiguous to parsers.
`,
			suggestions: [
				{
					id: "formatAsLink",
					updated: `
Multiple links: [https://first.com](https://first.com) and https://second.com
`,
				},
				{
					id: "wrapInAngleBrackets",
					updated: `
Multiple links: <https://first.com> and https://second.com
`,
				},
				{
					id: "formatAsLink",
					updated: `
Multiple links: https://first.com and [https://second.com](https://second.com)
`,
				},
				{
					id: "wrapInAngleBrackets",
					updated: `
Multiple links: https://first.com and <https://second.com>
`,
				},
			],
		},
		{
			code: `
# https://www.example.com/
`,
			snapshot: `
# https://www.example.com/
  ~~~~~~~~~~~~~~~~~~~~~~~~
  This bare URL is ambiguous to parsers.
`,
			suggestions: [
				{
					id: "formatAsLink",
					updated: `
# [https://www.example.com/](https://www.example.com/)
`,
				},
				{
					id: "wrapInAngleBrackets",
					updated: `
# <https://www.example.com/>
`,
				},
			],
		},
	],
	valid: [
		`For more info, visit <https://www.example.com/>`,
		`For more info, visit [Example Website](https://www.example.com)`,
		`Contact us at <user@example.com>`,
		`Contact us at [user@example.com](mailto:user@example.com)`,
		`# <https://www.example.com/>`,
		`Not a clickable link: \`https://www.example.com/\``,
		`
\`\`\`
https://www.example.com/
\`\`\`
`,
		`[Read the docs](https://www.example.com)`,
		`
[docs]: https://www.example.com/docs
`,
	],
});
