import rule from "./regexObscureRanges.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[A-z]/;
`,
			snapshot: `
/[A-z]/;
  ~~~
  Obscure character range 'A-z' (A to z) is not obvious.
`,
		},
		{
			code: `
/[0-A]/;
`,
			snapshot: `
/[0-A]/;
  ~~~
  Obscure character range '0-A' (0 to A) is not obvious.
`,
		},
		{
			code: `
/[Z-a]/;
`,
			snapshot: `
/[Z-a]/;
  ~~~
  Obscure character range 'Z-a' (Z to a) is not obvious.
`,
		},
		{
			code: String.raw`
/[A-\x43]/;
`,
			snapshot: String.raw`
/[A-\x43]/;
  ~~~~~~
  Obscure character range 'A-\x43' (A to C) is not obvious.
`,
		},
		{
			code: String.raw`
/[\cA-Z]/;
`,
			snapshot: String.raw`
/[\cA-Z]/;
  ~~~~~
  Obscure character range '\cA-Z' (U+0001 to Z) is not obvious.
`,
		},
		{
			code: `
/[*+-/]/;
`,
			snapshot: `
/[*+-/]/;
   ~~~
   Obscure character range '+-/' (+ to /) is not obvious.
`,
		},
		{
			code: String.raw`
/[\n-\r]/;
`,
			snapshot: String.raw`
/[\n-\r]/;
  ~~~~~
  Obscure character range '\n-\r' (U+000A to U+000D) is not obvious.
`,
		},
		{
			code: String.raw`
new RegExp("[A-z]");
`,
			snapshot: String.raw`
new RegExp("[A-z]");
             ~~~
             Obscure character range 'A-z' (A to z) is not obvious.
`,
		},
	],
	valid: [
		`/[a-z]/;`,
		`/[A-Z]/;`,
		`/[0-9]/;`,
		`/[a-f]/;`,
		`/[A-F]/;`,
		String.raw`/[\0-\x1F]/;`,
		String.raw`/[\x10-\xFF]/;`,
		String.raw`/[\cA-\cZ]/;`,
		String.raw`/[\2-\5]/;`,
		String.raw`/[\u0000-\uFFFF]/;`,
		`new RegExp("[a-z]");`,
		`RegExp(variable);`,
	],
});
