import { ruleTester } from "./ruleTester.ts";
import rule from "./svgTitles.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<svg />
`,
			snapshot: `
<svg />
 ~~~
 This <svg> element is missing a <title> child element.
`,
		},
		{
			code: `
<svg viewBox="0 0 100 100" />
`,
			snapshot: `
<svg viewBox="0 0 100 100" />
 ~~~
 This <svg> element is missing a <title> child element.
`,
		},
		{
			code: `
<svg>
    <circle cx="50" cy="50" r="40" />
</svg>`,
			snapshot: `
<svg>
 ~~~
 This <svg> element is missing a <title> child element.
    <circle cx="50" cy="50" r="40" />
</svg>`,
		},
		{
			code: `
<svg>
    <desc>Description only</desc>
</svg>`,
			snapshot: `
<svg>
 ~~~
 This <svg> element is missing a <title> child element.
    <desc>Description only</desc>
</svg>`,
		},
		{
			code: `
<svg aria-label="" />
`,
			snapshot: `
<svg aria-label="" />
 ~~~
 This <svg> element is missing a <title> child element.
`,
		},
		{
			code: `
<svg aria-label={""} />
`,
			snapshot: `
<svg aria-label={""} />
 ~~~
 This <svg> element is missing a <title> child element.
`,
		},
		{
			code: `
<svg aria-label={\`\`} />
`,
			snapshot: `
<svg aria-label={\`\`} />
 ~~~
 This <svg> element is missing a <title> child element.
`,
		},
		{
			code: `
<svg aria-label={undefined} />
`,
			snapshot: `
<svg aria-label={undefined} />
 ~~~
 This <svg> element is missing a <title> child element.
`,
		},
		{
			code: `
<svg aria-labelledby="" />
`,
			snapshot: `
<svg aria-labelledby="" />
 ~~~
 This <svg> element is missing a <title> child element.
`,
		},
	],
	valid: [
		{
			code: `
<svg>
    <title>Accessible title</title>
</svg>`,
		},
		{
			code: `
<svg>
    <title>Circle</title>
    <circle cx="50" cy="50" r="40" />
</svg>`,
		},
		{
			code: `
<svg aria-label="Accessible label" />
`,
		},
		{
			code: `
<svg aria-labelledby="title-id" />
`,
		},
		{
			code: `
<svg aria-labelledby="title-id">
    <circle cx="50" cy="50" r="40" />
</svg>
`,
		},
		{ code: `<div>Not an svg element</div>` },
	],
});
