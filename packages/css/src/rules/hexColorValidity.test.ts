import { ruleTester } from "../ruleTester.ts";
import rule from "./hexColorValidity.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
div {
  color: #1;
}
`,
			snapshot: `
div {
  color: #1;
         ~~
         The hex value \`1\` is invalid.
}
`,
		},
		{
			code: `
div {
  color: #a;
}
`,
			snapshot: `
div {
  color: #a;
         ~~
         The hex value \`a\` is invalid.
}
`,
		},
		{
			code: `
div {
  color: #12;
}
`,
			snapshot: `
div {
  color: #12;
         ~~~
         The hex value \`12\` is invalid.
}
`,
		},
		{
			code: `
div {
  color: #12345;
}
`,
			snapshot: `
div {
  color: #12345;
         ~~~~~~
         The hex value \`12345\` is invalid.
}
`,
		},
	],
	valid: [
		`
div {
  color: blue;
}
`,
		`
div {
  color: #012;
}
`,
		`
div {
  color: #abc;
}
`,
		`
div {
  color: #0123;
}
`,
		`
div {
  color: #abcd;
}
`,
		`
div {
  color: #012345;
}
`,
		`
div {
  color: #abcdef;
}
`,
		`
div {
  color: #01234567;
}
`,
		`
div {
  color: #abcdef01;
}
`,
	],
});
