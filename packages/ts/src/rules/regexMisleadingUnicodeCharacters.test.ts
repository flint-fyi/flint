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
  Misleading surrogate pair in character class without the \`u\` or \`v\` flag.
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
  Misleading surrogate pair in character class without the \`u\` or \`v\` flag.
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
			snapshot: String.raw`
/[A\u0301]/;
  ~~~~~~~
  Misleading combined character in character class.
`,
		},
		{
			code: String.raw`
/[A\u0301]/u;
`,
			snapshot: String.raw`
/[A\u0301]/u;
  ~~~~~~~
  Misleading combined character in character class.
`,
		},
		{
			code: String.raw`
/[\u0041\u0301]/;
`,
			snapshot: String.raw`
/[\u0041\u0301]/;
  ~~~~~~~~~~~~
  Misleading combined character in character class.
`,
		},
		{
			code: String.raw`
/[\u0041\u0301]/u;
`,
			snapshot: String.raw`
/[\u0041\u0301]/u;
  ~~~~~~~~~~~~
  Misleading combined character in character class.
`,
		},
		{
			code: `
/[❇️]/;
`,
			snapshot: `
/[❇️]/;
  ~~
  Misleading combined character in character class.
`,
		},
		{
			code: `
/[❇️]/u;
`,
			snapshot: `
/[❇️]/u;
  ~~
  Misleading combined character in character class.
`,
		},
		{
			code: `
/[👶🏻]/;
`,
			snapshot: `
/[👶🏻]/;
  ~~
  Misleading surrogate pair in character class without the \`u\` or \`v\` flag.
    ~~
    Misleading surrogate pair in character class without the \`u\` or \`v\` flag.
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
  Misleading emoji with skin tone modifier in character class.
`,
		},
		{
			code: String.raw`
/[\uD83D\uDC76\uD83C\uDFFB]/u;
`,
			snapshot: String.raw`
/[\uD83D\uDC76\uD83C\uDFFB]/u;
  ~~~~~~~~~~~~~~~~~~~~~~~~
  Misleading emoji with skin tone modifier in character class.
`,
		},
		{
			code: String.raw`
/[\u{1F476}\u{1F3FB}]/u;
`,
			snapshot: String.raw`
/[\u{1F476}\u{1F3FB}]/u;
  ~~~~~~~~~~~~~~~~~~
  Misleading emoji with skin tone modifier in character class.
`,
		},
		{
			code: `
/[🇯🇵]/;
`,
			snapshot: `
/[🇯🇵]/;
  ~~
  Misleading surrogate pair in character class without the \`u\` or \`v\` flag.
    ~~
    Misleading surrogate pair in character class without the \`u\` or \`v\` flag.
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
  Misleading regional indicator symbols (flag) in character class.
`,
		},
		{
			code: String.raw`
/[\uD83C\uDDEF\uD83C\uDDF5]/u;
`,
			snapshot: String.raw`
/[\uD83C\uDDEF\uD83C\uDDF5]/u;
  ~~~~~~~~~~~~~~~~~~~~~~~~
  Misleading regional indicator symbols (flag) in character class.
`,
		},
		{
			code: String.raw`
/[\u{1F1EF}\u{1F1F5}]/u;
`,
			snapshot: String.raw`
/[\u{1F1EF}\u{1F1F5}]/u;
  ~~~~~~~~~~~~~~~~~~
  Misleading regional indicator symbols (flag) in character class.
`,
		},
		{
			code: `
/[👨‍👩‍👦]/;
`,
			snapshot: `
/[👨‍👩‍👦]/;
  ~~
  Misleading surrogate pair in character class without the \`u\` or \`v\` flag.
   ~~~
   Misleading zero-width joiner sequence in character class.
     ~~
     Misleading surrogate pair in character class without the \`u\` or \`v\` flag.
      ~~~
      Misleading zero-width joiner sequence in character class.
        ~~
        Misleading surrogate pair in character class without the \`u\` or \`v\` flag.
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
  Misleading zero-width joiner sequence in character class.
`,
		},
		{
			code: `
/[👩‍👦]/u;
`,
			snapshot: `
/[👩‍👦]/u;
  ~~~~~
  Misleading zero-width joiner sequence in character class.
`,
		},
		{
			code: String.raw`
/[\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC66]/u;
`,
			snapshot: String.raw`
/[\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC66]/u;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Misleading zero-width joiner sequence in character class.
`,
		},
		{
			code: String.raw`
/[\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F466}]/u;
`,
			snapshot: String.raw`
/[\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F466}]/u;
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Misleading zero-width joiner sequence in character class.
`,
		},
		{
			code: String.raw`
/[\uD83D\u{DC4D}]/u;
`,
			snapshot: String.raw`
/[\uD83D\u{DC4D}]/u;
  ~~~~~~~~~~~~~~
  Misleading surrogate pair in character class.
`,
		},
		{
			code: String.raw`
/[\u{D83D}\uDC4D]/u;
`,
			snapshot: String.raw`
/[\u{D83D}\uDC4D]/u;
  ~~~~~~~~~~~~~~
  Misleading surrogate pair in character class.
`,
		},
		{
			code: String.raw`
/[\u{D83D}\u{DC4D}]/u;
`,
			snapshot: String.raw`
/[\u{D83D}\u{DC4D}]/u;
  ~~~~~~~~~~~~~~~~
  Misleading surrogate pair in character class.
`,
		},
		{
			code: `
/[👩‍👦][👩‍👦]/u;
`,
			snapshot: `
/[👩‍👦][👩‍👦]/u;
  ~~~~~
  Misleading zero-width joiner sequence in character class.
         ~~~~~
         Misleading zero-width joiner sequence in character class.
`,
		},
		{
			code: `
/[👨‍👩‍👦👩‍👦]/u;
`,
			snapshot: `
/[👨‍👩‍👦👩‍👦]/u;
  ~~~~~~~~
  Misleading zero-width joiner sequence in character class.
          ~~~~~
          Misleading zero-width joiner sequence in character class.
`,
		},
		{
			code: `
/[[👶🏻]]/v;
`,
			snapshot: `
/[[👶🏻]]/v;
   ~~~~
   Misleading emoji with skin tone modifier in character class.
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
