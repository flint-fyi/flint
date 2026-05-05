import rule from "./regexUnnecessarySetOperands.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/[\w&&\s]/v;
`,
			output: String.raw`
/[^^]/v;
`,
			snapshot: String.raw`
/[\w&&\s]/v;
  ~~~~~~
  This operation can be simplified: '\w' and '\s' are disjoint, so the result is always empty.
`,
		},
		{
			code: String.raw`
/[\w&&\d]/v;
`,
			output: String.raw`
/[\d]/v;
`,
			snapshot: String.raw`
/[\w&&\d]/v;
  ~~~~~~
  This operation can be simplified: '\d' is a subset of '\w', so the superset operand is redundant.
`,
		},
		{
			code: String.raw`
/[\d&&\w]/v;
`,
			output: String.raw`
/[\d]/v;
`,
			snapshot: String.raw`
/[\d&&\w]/v;
  ~~~~~~
  This operation can be simplified: '\d' is a subset of '\w', so the superset operand is redundant.
`,
		},
		{
			code: String.raw`
/[\d--\w]/v;
`,
			output: String.raw`
/[^^]/v;
`,
			snapshot: String.raw`
/[\d--\w]/v;
  ~~~~~~
  This operation can be simplified: '\d' is a subset of '\w', so the result is always empty.
`,
		},
		{
			code: String.raw`
/[\w--\s]/v;
`,
			output: String.raw`
/[\w]/v;
`,
			snapshot: String.raw`
/[\w--\s]/v;
  ~~~~~~
  This operation can be simplified: '\w' and '\s' are disjoint, so the subtraction has no effect.
`,
		},
		{
			code: String.raw`
/[[abc]&&[def]]/v;
`,
			output: String.raw`
/[^^]/v;
`,
			snapshot: String.raw`
/[[abc]&&[def]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[abc]' and '[def]' are disjoint, so the result is always empty.
`,
		},
		{
			code: String.raw`
/[[a-z]--[0-9]]/v;
`,
			output: String.raw`
/[a-z]/v;
`,
			snapshot: String.raw`
/[[a-z]--[0-9]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[a-z]' and '[0-9]' are disjoint, so the subtraction has no effect.
`,
		},
		{
			code: String.raw`
/[[a-z]&&[a-m]]/v;
`,
			output: String.raw`
/[a-m]/v;
`,
			snapshot: String.raw`
/[[a-z]&&[a-m]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[a-m]' is a subset of '[a-z]', so the superset operand is redundant.
`,
		},
		{
			code: `
new RegExp("[\\\\w&&\\\\s]", "v");
`,
			snapshot: `
new RegExp("[\\\\w&&\\\\s]", "v");
             ~~~~~~
             This operation can be simplified: '\\w' and '\\s' are disjoint, so the result is always empty.
`,
		},
		{
			code: String.raw`
/[[abc]--[abc]]/v;
`,
			output: String.raw`
/[^^]/v;
`,
			snapshot: String.raw`
/[[abc]--[abc]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[abc]' is a subset of '[abc]', so the result is always empty.
`,
		},
		{
			code: String.raw`
/[[a-f]&&[a-c]]/v;
`,
			output: String.raw`
/[a-c]/v;
`,
			snapshot: String.raw`
/[[a-f]&&[a-c]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[a-c]' is a subset of '[a-f]', so the superset operand is redundant.
`,
		},
		{
			code: String.raw`
/[[a-c]&&[a-f]]/v;
`,
			output: String.raw`
/[a-c]/v;
`,
			snapshot: String.raw`
/[[a-c]&&[a-f]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[a-c]' is a subset of '[a-f]', so the superset operand is redundant.
`,
		},
		{
			code: String.raw`
/[\s&&\d]/v;
`,
			output: String.raw`
/[^^]/v;
`,
			snapshot: String.raw`
/[\s&&\d]/v;
  ~~~~~~
  This operation can be simplified: '\s' and '\d' are disjoint, so the result is always empty.
`,
		},
		{
			code: String.raw`
/[\d--\d]/v;
`,
			output: String.raw`
/[^^]/v;
`,
			snapshot: String.raw`
/[\d--\d]/v;
  ~~~~~~
  This operation can be simplified: '\d' is a subset of '\d', so the result is always empty.
`,
		},
		{
			code: String.raw`
/[[0-5]--[6-9]]/v;
`,
			output: String.raw`
/[0-5]/v;
`,
			snapshot: String.raw`
/[[0-5]--[6-9]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[0-5]' and '[6-9]' are disjoint, so the subtraction has no effect.
`,
		},
		{
			code: String.raw`
/[[A-Z]--[a-z]]/v;
`,
			output: String.raw`
/[A-Z]/v;
`,
			snapshot: String.raw`
/[[A-Z]--[a-z]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[A-Z]' and '[a-z]' are disjoint, so the subtraction has no effect.
`,
		},
		{
			code: String.raw`
/[\w&&[abc]]/v;
`,
			output: String.raw`
/[abc]/v;
`,
			snapshot: String.raw`
/[\w&&[abc]]/v;
  ~~~~~~~~~
  This operation can be simplified: '[abc]' is a subset of '\w', so the superset operand is redundant.
`,
		},
		{
			code: String.raw`
/[[abc]&&\w]/v;
`,
			output: String.raw`
/[abc]/v;
`,
			snapshot: String.raw`
/[[abc]&&\w]/v;
  ~~~~~~~~~
  This operation can be simplified: '[abc]' is a subset of '\w', so the superset operand is redundant.
`,
		},
		{
			code: String.raw`
/[[\d\w]&&\d]/v;
`,
			output: String.raw`
/[\d]/v;
`,
			snapshot: String.raw`
/[[\d\w]&&\d]/v;
  ~~~~~~~~~~
  This operation can be simplified: '\d' is a subset of '[\d\w]', so the superset operand is redundant.
`,
		},
		{
			code: `
new RegExp("[\\\\w--\\\\s]", "v");
`,
			snapshot: `
new RegExp("[\\\\w--\\\\s]", "v");
             ~~~~~~
             This operation can be simplified: '\\w' and '\\s' are disjoint, so the subtraction has no effect.
`,
		},
		{
			code: `
new RegExp("[\\\\d&&\\\\w]", "v");
`,
			snapshot: `
new RegExp("[\\\\d&&\\\\w]", "v");
             ~~~~~~
             This operation can be simplified: '\\d' is a subset of '\\w', so the superset operand is redundant.
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
