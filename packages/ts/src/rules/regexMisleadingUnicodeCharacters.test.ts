import rule from "./regexMisleadingUnicodeCharacters.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/[👍]/;
`,
			snapshot: `
/[👍]/;
  ~~
  Surrogate pair in character class without the \`u\` or \`v\` flag.
`,
			suggestions: [
				{
					id: "addUnicodeFlag",
					updated: `
/[👍]/u;
`,
				},
			],
		},
		{
			code: String.raw`
/[\uD83D\uDC4D]/;
`,
			snapshot: `
/[\\uD83D\\uDC4D]/;
  ~~~~~~~~~~~~
  Surrogate pair in character class without the \`u\` or \`v\` flag.
`,
			suggestions: [
				{
					id: "addUnicodeFlag",
					updated: String.raw`
/[\uD83D\uDC4D]/u;
`,
				},
			],
		},
		{
			code: String.raw`
/[A\u0301]/;
`,
			snapshot: `
/[A\\u0301]/;
  ~~~~~~~
  Combined character in character class.
`,
		},
		{
			code: String.raw`
/[A\u0301]/u;
`,
			snapshot: `
/[A\\u0301]/u;
  ~~~~~~~
  Combined character in character class.
`,
		},
		{
			code: String.raw`
/[\u0041\u0301]/;
`,
			snapshot: `
/[\\u0041\\u0301]/;
  ~~~~~~~~~~~~
  Combined character in character class.
`,
		},
		{
			code: String.raw`
/[\u0041\u0301]/u;
`,
			snapshot: `
/[\\u0041\\u0301]/u;
  ~~~~~~~~~~~~
  Combined character in character class.
`,
		},
		{
			code: `
/[❇️]/;
`,
			snapshot: `
/[❇️]/;
  ~~
  Combined character in character class.
`,
		},
		{
			code: `
/[❇️]/u;
`,
			snapshot: `
/[❇️]/u;
  ~~
  Combined character in character class.
`,
		},
		{
			code: `
/[👶🏻]/;
`,
			snapshot: `
/[👶🏻]/;
  ~~
  Surrogate pair in character class without the \`u\` or \`v\` flag.
    ~~
    Surrogate pair in character class without the \`u\` or \`v\` flag.
`,
			suggestions: [
				{
					id: "addUnicodeFlag",
					updated: `
/[👶🏻]/u;
`,
				},
				{
					id: "addUnicodeFlag",
					updated: `
/[👶🏻]/u;
`,
				},
			],
		},
		{
			code: `
/[👶🏻]/u;
`,
			snapshot: `
/[👶🏻]/u;
  ~~~~
  Emoji with skin tone modifier in character class.
`,
		},
		{
			code: String.raw`
/[\uD83D\uDC76\uD83C\uDFFB]/u;
`,
			snapshot: `
/[\\uD83D\\uDC76\\uD83C\\uDFFB]/u;
  ~~~~~~~~~~~~~~~~~~~~~~~~
  Emoji with skin tone modifier in character class.
`,
		},
		{
			code: String.raw`
/[\u{1F476}\u{1F3FB}]/u;
`,
			snapshot: `
/[\\u{1F476}\\u{1F3FB}]/u;
  ~~~~~~~~~~~~~~~~~~
  Emoji with skin tone modifier in character class.
`,
		},
		{
			code: `
/[🇯🇵]/;
`,
			snapshot: `
/[🇯🇵]/;
  ~~
  Surrogate pair in character class without the \`u\` or \`v\` flag.
    ~~
    Surrogate pair in character class without the \`u\` or \`v\` flag.
`,
			suggestions: [
				{
					id: "addUnicodeFlag",
					updated: `
/[🇯🇵]/u;
`,
				},
				{
					id: "addUnicodeFlag",
					updated: `
/[🇯🇵]/u;
`,
				},
			],
		},
		{
			code: `
/[🇯🇵]/u;
`,
			snapshot: `
/[🇯🇵]/u;
  ~~~~
  Regional indicator symbols (flag) in character class.
`,
		},
		{
			code: String.raw`
/[\uD83C\uDDEF\uD83C\uDDF5]/u;
`,
			snapshot: `
/[\\uD83C\\uDDEF\\uD83C\\uDDF5]/u;
  ~~~~~~~~~~~~~~~~~~~~~~~~
  Regional indicator symbols (flag) in character class.
`,
		},
		{
			code: String.raw`
/[\u{1F1EF}\u{1F1F5}]/u;
`,
			snapshot: `
/[\\u{1F1EF}\\u{1F1F5}]/u;
  ~~~~~~~~~~~~~~~~~~
  Regional indicator symbols (flag) in character class.
`,
		},
		{
			code: `
/[👨‍👩‍👦]/;
`,
			snapshot: `
/[👨‍👩‍👦]/;
  ~~
  Surrogate pair in character class without the \`u\` or \`v\` flag.
     ~~
     Surrogate pair in character class without the \`u\` or \`v\` flag.
        ~~
        Surrogate pair in character class without the \`u\` or \`v\` flag.
   ~~~
   Zero-width joiner sequence in character class.
      ~~~
      Zero-width joiner sequence in character class.
`,
			suggestions: [
				{
					id: "addUnicodeFlag",
					updated: `
/[👨‍👩‍👦]/u;
`,
				},
				{
					id: "addUnicodeFlag",
					updated: `
/[👨‍👩‍👦]/u;
`,
				},
				{
					id: "addUnicodeFlag",
					updated: `
/[👨‍👩‍👦]/u;
`,
				},
			],
		},
		{
			code: `
/[👨‍👩‍👦]/u;
`,
			snapshot: `
/[👨‍👩‍👦]/u;
  ~~~~~~~~
  Zero-width joiner sequence in character class.
`,
		},
		{
			code: `
/[👩‍👦]/u;
`,
			snapshot: `
/[👩‍👦]/u;
  ~~~~~
  Zero-width joiner sequence in character class.
`,
		},
		{
			code: String.raw`
/[\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC66]/u;
`,
			snapshot: `
/[\\uD83D\\uDC68\\u200D\\uD83D\\uDC69\\u200D\\uD83D\\uDC66]/u;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Zero-width joiner sequence in character class.
`,
		},
		{
			code: String.raw`
/[\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F466}]/u;
`,
			snapshot: `
/[\\u{1F468}\\u{200D}\\u{1F469}\\u{200D}\\u{1F466}]/u;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Zero-width joiner sequence in character class.
`,
		},
		{
			code: String.raw`
/[\uD83D\u{DC4D}]/u;
`,
			snapshot: `
/[\\uD83D\\u{DC4D}]/u;
  ~~~~~~~~~~~~~~
  Surrogate pair in character class.
`,
		},
		{
			code: String.raw`
/[\u{D83D}\uDC4D]/u;
`,
			snapshot: `
/[\\u{D83D}\\uDC4D]/u;
  ~~~~~~~~~~~~~~
  Surrogate pair in character class.
`,
		},
		{
			code: String.raw`
/[\u{D83D}\u{DC4D}]/u;
`,
			snapshot: `
/[\\u{D83D}\\u{DC4D}]/u;
  ~~~~~~~~~~~~~~~~
  Surrogate pair in character class.
`,
		},
		{
			code: `
/[👩‍👦][👩‍👦]/u;
`,
			snapshot: `
/[👩‍👦][👩‍👦]/u;
  ~~~~~
  Zero-width joiner sequence in character class.
         ~~~~~
         Zero-width joiner sequence in character class.
`,
		},
		{
			code: `
/[👨‍👩‍👦👩‍👦]/u;
`,
			snapshot: `
/[👨‍👩‍👦👩‍👦]/u;
  ~~~~~~~~
  Zero-width joiner sequence in character class.
          ~~~~~
          Zero-width joiner sequence in character class.
`,
		},
		{
			code: `
/[[👶🏻]]/v;
`,
			snapshot: `
/[[👶🏻]]/v;
   ~~~~
   Emoji with skin tone modifier in character class.
`,
		},
	],
	valid: [
		`/[👍]/u`,
		String.raw`/[\uD83D\uDC4D]/u`,
		String.raw`/[\u{1F44D}]/u`,
		`/❇️/`,
		`/Á/`,
		`/[❇]/`,
		`/👶🏻/`,
		`/[👶]/u`,
		`/🇯🇵/`,
		`/[JP]/`,
		`/👨‍👩‍👦/`,
		String.raw`/[\uD83D]/`,
		String.raw`/[\uDC4D]/`,
		String.raw`/[\uD83D]/u`,
		String.raw`/[\uDC4D]/u`,
		String.raw`/[\u0301]/`,
		String.raw`/[\uFE0F]/`,
		String.raw`/[\u0301]/u`,
		String.raw`/[\uFE0F]/u`,
		String.raw`/[\u{1F3FB}]/u`,
		`/[🇯]/u`,
		`/[🇵]/u`,
		String.raw`/[\u200D]/`,
		String.raw`/[\u200D]/u`,
		`/[👍]/v`,
		String.raw`/^[\q{👶🏻}]$/v`,
		String.raw`/[🇯\q{abc}🇵]/v`,
		`/[🇯[A]🇵]/v`,
		`/[🇯[A--B]🇵]/v`,
	],
});
