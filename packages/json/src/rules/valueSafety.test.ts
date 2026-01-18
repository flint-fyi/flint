import { ruleTester } from "./ruleTester.ts";
import rule from "./valueSafety.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
[2e308]`,
			snapshot: `
[2e308]
 ~~~~~
 This number evaluates to Infinity.`,
		},
		{
			code: `
[-2e308]`,
			snapshot: `
[-2e308]
  ~~~~~
  This number evaluates to Infinity.`,
		},
		{
			code: `
{
    "value": 1e400
}
`,
			snapshot: `
{
    "value": 1e400
             ~~~~~
             This number evaluates to Infinity.
}
`,
		},
		{
			code: `
["\ud83d"]`,
			snapshot: `
["\ud83d"]
 ~~~
 This string contains an unmatched surrogate.`,
		},
		{
			code: `
{
    "emoji": "\ud83d"
}
`,
			snapshot: `
{
    "emoji": "\ud83d"
             ~~~
             This string contains an unmatched surrogate.
}
`,
		},
		{
			code: `
[1e-400]`,
			snapshot: `
[1e-400]
 ~~~~~~
 This number is too small and evaluates to zero.`,
		},
		{
			code: `
{
    "tiny": 1e-500
}
`,
			snapshot: `
{
    "tiny": 1e-500
            ~~~~~~
            This number is too small and evaluates to zero.
}
`,
		},
		{
			code: `
[9007199254740992]`,
			snapshot: `
[9007199254740992]
 ~~~~~~~~~~~~~~~~
 This integer is outside the safe integer range.`,
		},
		{
			code: `
[-9007199254740992]`,
			snapshot: `
[-9007199254740992]
  ~~~~~~~~~~~~~~~~
  This integer is outside the safe integer range.`,
		},
		{
			code: `
{
    "id": 9007199254740993
}
`,
			snapshot: `
{
    "id": 9007199254740993
          ~~~~~~~~~~~~~~~~
          This integer is outside the safe integer range.
}
`,
		},
		{
			code: `
[2.2250738585072009e-308]`,
			snapshot: `
[2.2250738585072009e-308]
 ~~~~~~~~~~~~~~~~~~~~~~~
 This subnormal number may be handled inconsistently.`,
		},
		{
			code: `
{
    "subnormal": 1e-320
}
`,
			snapshot: `
{
    "subnormal": 1e-320
                 ~~~~~~
                 This subnormal number may be handled inconsistently.
}
`,
		},
	],
	valid: [
		`[123]`,
		`[1234]`,
		`[12345]`,
		`
{
    "numbers": [0, 100, -50, 3.14]
}
`,
		`["\ud83d\udd25"]`,
		`
{
    "emoji": "🔥"
}
`,
		`[0]`,
		`[0.0]`,
		`[0e0]`,
		`[0.00000e0000]`,
		`
{
    "zero": 0,
    "zeroFloat": 0.0,
    "zeroExp": 0e10
}
`,
		`[9007199254740991]`,
		`[-9007199254740991]`,
		`
{
    "safeInteger": 9007199254740991
}
`,
	],
});
