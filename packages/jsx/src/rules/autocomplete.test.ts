import rule from "./autocomplete.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
<input type="text" autocomplete="foo" />
`,
			snapshot: `
<input type="text" autocomplete="foo" />
                   ~~~~~~~~~~~~
                   \`foo\` is not a valid value for autocomplete.
`,
		},
		{
			code: `
<input type="email" autocomplete="invalid" />
`,
			snapshot: `
<input type="email" autocomplete="invalid" />
                    ~~~~~~~~~~~~
                    \`invalid\` is not a valid value for autocomplete.
`,
		},
		{
			code: `
<input type="text" autocomplete="name invalid" />
`,
			snapshot: `
<input type="text" autocomplete="name invalid" />
                   ~~~~~~~~~~~~
                   \`name invalid\` is not a valid value for autocomplete.
`,
		},
		{
			code: `
<input type="text" autocomplete="home url" />
`,
			snapshot: `
<input type="text" autocomplete="home url" />
                   ~~~~~~~~~~~~
                   \`home url\` is not a valid value for autocomplete.
`,
		},
		{
			code: `
<input autocomplete="incorrect" />
`,
			snapshot: `
<input autocomplete="incorrect" />
       ~~~~~~~~~~~~
       \`incorrect\` is not a valid value for autocomplete.
`,
		},
	],
	valid: [
		`<input type="text" />`,
		`<input type="text" autocomplete="name" />`,
		`<input type="text" autocomplete="email" />`,
		`<input type="text" autocomplete="off" />`,
		`<input type="text" autocomplete="on" />`,
		`<input type="text" autocomplete="username" />`,
		`<input type="password" autocomplete="current-password" />`,
		`<input type="password" autocomplete="new-password" />`,
		`<input type="tel" autocomplete="tel" />`,
		`<input type="url" autocomplete="url" />`,
		`<input type="text" autocomplete="billing street-address" />`,
		`<input type="text" autocomplete="shipping postal-code" />`,
		`<input type="text" autocomplete="billing country" />`,
		`<input type="text" autocomplete />`,
		`<input type="text" autocomplete={otherValue} />`,
		`<input type="text" autocomplete={otherValue || "name"} />`,
		`<div autocomplete="invalid" />`,
		`<Foo autocomplete="bar" />`,
		`<button type="submit" />`,
	],
});
