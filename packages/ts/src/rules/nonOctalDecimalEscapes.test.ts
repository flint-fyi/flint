import rule from "./nonOctalDecimalEscapes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
"\8"
`,
			snapshot: String.raw`
"\8"
 ~~
 Non-octal decimal escape sequences (\8 and \9) should not be used in string literals.
`,
		},
		{
			code: String.raw`
"\9"
`,
			snapshot: String.raw`
"\9"
 ~~
 Non-octal decimal escape sequences (\8 and \9) should not be used in string literals.
`,
		},
		{
			code: String.raw`
"w\8less"
`,
			snapshot: String.raw`
"w\8less"
  ~~
  Non-octal decimal escape sequences (\8 and \9) should not be used in string literals.
`,
		},
		{
			code: String.raw`
"December 1\9"
`,
			snapshot: String.raw`
"December 1\9"
           ~~
           Non-octal decimal escape sequences (\8 and \9) should not be used in string literals.
`,
		},
		{
			code: String.raw`
"Don't use \8 and \9 escapes."
`,
			snapshot: String.raw`
"Don't use \8 and \9 escapes."
           ~~
           Non-octal decimal escape sequences (\8 and \9) should not be used in string literals.
                  ~~
                  Non-octal decimal escape sequences (\8 and \9) should not be used in string literals.
`,
		},
		{
			code: String.raw`
"\0\8"
`,
			snapshot: String.raw`
"\0\8"
   ~~
   Non-octal decimal escape sequences (\8 and \9) should not be used in string literals.
`,
		},
	],
	valid: [
		'"8"',
		'"9"',
		'"w8less"',
		'"December 19"',
		String.raw`"\\8"`,
		String.raw`"\0\u0038"`,
	],
});
