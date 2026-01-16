import rule from "./iframeTitles.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<iframe />
`,
			snapshot: `
<iframe />
 ~~~~~~
 This <iframe> element is missing a \`title\` prop.
`,
		},
		{
			code: `
<iframe src="https://example.com" />
`,
			snapshot: `
<iframe src="https://example.com" />
 ~~~~~~
 This <iframe> element is missing a \`title\` prop.
`,
		},
		{
			code: `
<iframe title="" />
`,
			snapshot: `
<iframe title="" />
 ~~~~~~
 This <iframe> element is missing a \`title\` prop.
`,
		},
		{
			code: `
<iframe title={''} />
`,
			snapshot: `
<iframe title={''} />
 ~~~~~~
 This <iframe> element is missing a \`title\` prop.
`,
		},
		{
			code: `
<iframe title={\`\`} />
`,
			snapshot: `
<iframe title={\`\`} />
 ~~~~~~
 This <iframe> element is missing a \`title\` prop.
`,
		},
		{
			code: `
<iframe title={undefined} />
`,
			snapshot: `
<iframe title={undefined} />
 ~~~~~~
 This <iframe> element is missing a \`title\` prop.
`,
		},
	],
	valid: [
		{
			code: `<iframe title="This is a unique title" />
	`,
		},
		{
			code: `<iframe title={uniqueTitle} />
	`,
		},
		{
			code: `<iframe title="Video player" src="video.mp4" />
	`,
		},
		{ code: `<div>Not an iframe</div>` },
	],
});
