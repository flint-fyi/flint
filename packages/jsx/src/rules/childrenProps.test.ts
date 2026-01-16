import rule from "./childrenProps.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<div children="Hello" />
`,
			snapshot: `
<div children="Hello" />
     ~~~~~~~~~~~~~~~~
     Prefer providing children as content between opening and closing tags, not as a \`children\` prop.
`,
		},
		{
			code: `
<Component children={<span>Test</span>} />
`,
			snapshot: `
<Component children={<span>Test</span>} />
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           Prefer providing children as content between opening and closing tags, not as a \`children\` prop.
`,
		},
		{
			code: `
<button children={["Click me"]} />
`,
			snapshot: `
<button children={["Click me"]} />
        ~~~~~~~~~~~~~~~~~~~~~~~
        Prefer providing children as content between opening and closing tags, not as a \`children\` prop.
`,
		},
		{
			code: `
<div children={value} />
`,
			snapshot: `
<div children={value} />
     ~~~~~~~~~~~~~~~~
     Prefer providing children as content between opening and closing tags, not as a \`children\` prop.
`,
		},
	],
	valid: [
		{ code: `<div />` },
		{ code: `<div>Hello</div>` },
		{ code: `<Component><span>Test</span></Component>` },
		{ code: `<button>Click me</button>` },
		{ code: `<div>{value}</div>` },
	],
});
