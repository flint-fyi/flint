import rule from "./regexUnnecessarySetOperands.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/[\w&&\s]/v;
`,
			snapshot: String.raw`
/[\w&&\s]/v;
  ~~~~~~
  Simplify set operation: '\w' and '\s' are disjoint, so the result is always empty.
`,
		},
		{
			code: String.raw`
/[\w&&\d]/v;
`,
			snapshot: String.raw`
/[\w&&\d]/v;
  ~~~~~~
  Simplify set operation: '\d' is a subset of '\w', so the superset operand is redundant.
`,
		},
		{
			code: String.raw`
/[\d&&\w]/v;
`,
			snapshot: String.raw`
/[\d&&\w]/v;
  ~~~~~~
  Simplify set operation: '\d' is a subset of '\w', so the superset operand is redundant.
`,
		},
		{
			code: String.raw`
/[\d--\w]/v;
`,
			snapshot: String.raw`
/[\d--\w]/v;
  ~~~~~~
  Simplify set operation: '\d' is a subset of '\w', so the result is always empty.
`,
		},
		{
			code: String.raw`
/[\w--\s]/v;
`,
			snapshot: String.raw`
/[\w--\s]/v;
  ~~~~~~
  Simplify set operation: '\w' and '\s' are disjoint, so the subtraction has no effect.
`,
		},
		{
			code: String.raw`
/[[abc]&&[def]]/v;
`,
			snapshot: String.raw`
/[[abc]&&[def]]/v;
  ~~~~~~~~~~~~
  Simplify set operation: '[abc]' and '[def]' are disjoint, so the result is always empty.
`,
		},
		{
			code: String.raw`
/[[a-z]--[0-9]]/v;
`,
			snapshot: String.raw`
/[[a-z]--[0-9]]/v;
  ~~~~~~~~~~~~
  Simplify set operation: '[a-z]' and '[0-9]' are disjoint, so the subtraction has no effect.
`,
		},
		{
			code: String.raw`
/[[a-z]&&[a-m]]/v;
`,
			snapshot: String.raw`
/[[a-z]&&[a-m]]/v;
  ~~~~~~~~~~~~
  Simplify set operation: '[a-m]' is a subset of '[a-z]', so the superset operand is redundant.
`,
		},
		{
			code: `
new RegExp("[\\\\w&&\\\\s]", "v");
`,
			snapshot: `
new RegExp("[\\\\w&&\\\\s]", "v");
             ~~~~~~
             Simplify set operation: '\\w' and '\\s' are disjoint, so the result is always empty.
`,
		},
	],
	valid: [
		String.raw`/[\w&&\s]/`,
		String.raw`/[\w&&\s]/u`,
		String.raw`/[\w--\d]/v`,
		String.raw`/[\w\d]/v`,
		String.raw`/[\w]/v`,
		String.raw`/[a-z]/v`,
		String.raw`/[[a-z]--[aeiou]]/v`,
		String.raw`/test/v`,
		String.raw`new RegExp("[\\w&&\\s]")`,
		String.raw`new RegExp("[\\w&&\\s]", "u")`,
	],
});
