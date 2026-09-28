import rule from "./regexUnnecessarySetOperands.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/[\w&&\s]/v;
`,
			output: `
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
			output: `
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
			code: `
/[[abc]&&[def]]/v;
`,
			output: `
/[^^]/v;
`,
			snapshot: `
/[[abc]&&[def]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[abc]' and '[def]' are disjoint, so the result is always empty.
`,
		},
		{
			code: `
/[[a-z]--[0-9]]/v;
`,
			output: `
/[a-z]/v;
`,
			snapshot: `
/[[a-z]--[0-9]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[a-z]' and '[0-9]' are disjoint, so the subtraction has no effect.
`,
		},
		{
			code: `
/[[a-z]&&[a-m]]/v;
`,
			output: `
/[a-m]/v;
`,
			snapshot: `
/[[a-z]&&[a-m]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[a-m]' is a subset of '[a-z]', so the superset operand is redundant.
`,
		},
		{
			code: String.raw`
new RegExp("[\\w&&\\s]", "v");
`,
			snapshot: String.raw`
new RegExp("[\\w&&\\s]", "v");
             ~~~~~~
             This operation can be simplified: '\w' and '\s' are disjoint, so the result is always empty.
`,
		},
		{
			code: `
/[[abc]--[abc]]/v;
`,
			output: `
/[^^]/v;
`,
			snapshot: `
/[[abc]--[abc]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[abc]' is a subset of '[abc]', so the result is always empty.
`,
		},
		{
			code: `
/[[a-f]&&[a-c]]/v;
`,
			output: `
/[a-c]/v;
`,
			snapshot: `
/[[a-f]&&[a-c]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[a-c]' is a subset of '[a-f]', so the superset operand is redundant.
`,
		},
		{
			code: `
/[[a-c]&&[a-f]]/v;
`,
			output: `
/[a-c]/v;
`,
			snapshot: `
/[[a-c]&&[a-f]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[a-c]' is a subset of '[a-f]', so the superset operand is redundant.
`,
		},
		{
			code: String.raw`
/[\s&&\d]/v;
`,
			output: `
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
			output: `
/[^^]/v;
`,
			snapshot: String.raw`
/[\d--\d]/v;
  ~~~~~~
  This operation can be simplified: '\d' is a subset of '\d', so the result is always empty.
`,
		},
		{
			code: `
/[[0-5]--[6-9]]/v;
`,
			output: `
/[0-5]/v;
`,
			snapshot: `
/[[0-5]--[6-9]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[0-5]' and '[6-9]' are disjoint, so the subtraction has no effect.
`,
		},
		{
			code: `
/[[A-Z]--[a-z]]/v;
`,
			output: `
/[A-Z]/v;
`,
			snapshot: `
/[[A-Z]--[a-z]]/v;
  ~~~~~~~~~~~~
  This operation can be simplified: '[A-Z]' and '[a-z]' are disjoint, so the subtraction has no effect.
`,
		},
		{
			code: String.raw`
/[\w&&[abc]]/v;
`,
			output: `
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
			output: `
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
			code: String.raw`
new RegExp("[\\w--\\s]", "v");
`,
			snapshot: String.raw`
new RegExp("[\\w--\\s]", "v");
             ~~~~~~
             This operation can be simplified: '\w' and '\s' are disjoint, so the subtraction has no effect.
`,
		},
		{
			code: String.raw`
new RegExp("[\\d&&\\w]", "v");
`,
			snapshot: String.raw`
new RegExp("[\\d&&\\w]", "v");
             ~~~~~~
             This operation can be simplified: '\d' is a subset of '\w', so the superset operand is redundant.
`,
		},
	],
	valid: [
		String.raw`/[\w&&\s]/`,
		String.raw`/[\w&&\s]/u`,
		String.raw`/[\w--\d]/v`,
		String.raw`/[\w\d]/v`,
		String.raw`/[\w]/v`,
		"/[a-z]/v",
		"/[[a-z]--[aeiou]]/v",
		"/test/v",
		String.raw`new RegExp("[\\w&&\\s]")`,
		String.raw`new RegExp("[\\w&&\\s]", "u")`,
	],
});
