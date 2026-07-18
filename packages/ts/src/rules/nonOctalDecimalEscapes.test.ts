import rule from "./nonOctalDecimalEscapes.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
"\\8"
`,
			snapshot: `
"\\8"
 ~~
 Non-octal decimal escape sequences (\\8 and \\9) should not be used in string literals.
`,
		},
		{
			code: `
"\\9"
`,
			snapshot: `
"\\9"
 ~~
 Non-octal decimal escape sequences (\\8 and \\9) should not be used in string literals.
`,
		},
		{
			code: `
"w\\8less"
`,
			snapshot: `
"w\\8less"
  ~~
  Non-octal decimal escape sequences (\\8 and \\9) should not be used in string literals.
`,
		},
		{
			code: `
"December 1\\9"
`,
			snapshot: `
"December 1\\9"
           ~~
           Non-octal decimal escape sequences (\\8 and \\9) should not be used in string literals.
`,
		},
		{
			code: `
"Don't use \\8 and \\9 escapes."
`,
			snapshot: `
"Don't use \\8 and \\9 escapes."
           ~~
           Non-octal decimal escape sequences (\\8 and \\9) should not be used in string literals.
                  ~~
                  Non-octal decimal escape sequences (\\8 and \\9) should not be used in string literals.
`,
		},
		{
			code: `
"\\0\\8"
`,
			snapshot: `
"\\0\\8"
   ~~
   Non-octal decimal escape sequences (\\8 and \\9) should not be used in string literals.
`,
		},
	],
	valid: ['"8"', '"9"', '"w8less"', '"December 19"', '"\\\\8"', '"\\0\\u0038"'],
});
