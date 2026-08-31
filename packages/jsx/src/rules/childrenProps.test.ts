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
declare const Component: (props: Record<string, unknown>) => unknown;
<Component children={<span>Test</span>} />
`,
			snapshot: `
declare const Component: (props: Record<string, unknown>) => unknown;
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
declare const value: unknown;
<div children={value} />
`,
			snapshot: `
declare const value: unknown;
<div children={value} />
     ~~~~~~~~~~~~~~~~
     Prefer providing children as content between opening and closing tags, not as a \`children\` prop.
`,
		},
	],
	valid: [
		`<div />`,
		`<div>Hello</div>`,
		`
declare const Component: (props: Record<string, unknown>) => unknown;
<Component><span>Test</span></Component>`,
		`<button>Click me</button>`,
		`
declare const value: unknown;
<div>{value}</div>`,
	],
});
