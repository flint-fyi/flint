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
		{ code: `<input type="text" />` },
		{ code: `<input type="text" autocomplete="name" />` },
		{
			code: `<input type="text" autocomplete="email" />`,
		},
		{ code: `<input type="text" autocomplete="off" />` },
		{ code: `<input type="text" autocomplete="on" />` },
		{
			code: `<input type="text" autocomplete="username" />`,
		},
		{
			code: `<input type="password" autocomplete="current-password" />`,
		},
		{
			code: `<input type="password" autocomplete="new-password" />`,
		},
		{ code: `<input type="tel" autocomplete="tel" />` },
		{ code: `<input type="url" autocomplete="url" />` },
		{
			code: `<input type="text" autocomplete="billing street-address" />`,
		},
		{
			code: `<input type="text" autocomplete="shipping postal-code" />`,
		},
		{
			code: `<input type="text" autocomplete="billing country" />`,
		},
		{ code: `<input type="text" autocomplete />` },
		{
			code: `<input type="text" autocomplete={otherValue} />`,
		},
		{
			code: `<input type="text" autocomplete={otherValue || "name"} />`,
		},
		{ code: `<div autocomplete="invalid" />` },
		{ code: `<Foo autocomplete="bar" />` },
		{ code: `<button type="submit" />` },
	],
});
