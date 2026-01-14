import rule from "./distractingElements.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<marquee />`,
			snapshot: `
<marquee />
 ~~~~~~~
 The <marquee> element is distracting and deprecated.`,
		},
		{
			code: `
<blink />`,
			snapshot: `
<blink />
 ~~~~~
 The <blink> element is distracting and deprecated.`,
		},
		{
			code: `
<marquee>Hello</marquee>`,
			snapshot: `
<marquee>Hello</marquee>
 ~~~~~~~
 The <marquee> element is distracting and deprecated.`,
		},
		{
			code: `
<BLINK>Alert!</BLINK>`,
			snapshot: `
<BLINK>Alert!</BLINK>
 ~~~~~
 The <blink> element is distracting and deprecated.`,
		},
	],
	valid: [
		{ code: `<div />` },
		{ code: `<span>Text</span>` },
		{ code: `<button>Click me</button>` },
		{
			code: `<div className="marquee-style">Animated</div>`,
		},
	],
});
