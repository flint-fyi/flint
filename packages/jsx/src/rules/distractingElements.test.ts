import rule from "./distractingElements.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<marquee />
`,
			snapshot: `
<marquee />
 ~~~~~~~
 The <marquee> element is distracting and deprecated.
`,
		},
		{
			code: `
<blink />
`,
			snapshot: `
<blink />
 ~~~~~
 The <blink> element is distracting and deprecated.
`,
		},
		{
			code: `
<marquee>Hello</marquee>
`,
			snapshot: `
<marquee>Hello</marquee>
 ~~~~~~~
 The <marquee> element is distracting and deprecated.
`,
		},
		{
			code: `
declare const BLINK: (props: Record<string, unknown>) => unknown;
<BLINK>Alert!</BLINK>
`,
			snapshot: `
declare const BLINK: (props: Record<string, unknown>) => unknown;
<BLINK>Alert!</BLINK>
 ~~~~~
 The <blink> element is distracting and deprecated.
`,
		},
	],
	valid: [
		`<div />`,
		`<span>Text</span>`,
		`<button>Click me</button>`,
		`<div className="marquee-style">Animated</div>`,
	],
});
