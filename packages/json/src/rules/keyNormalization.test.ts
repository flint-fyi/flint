import rule from "./keyNormalization.ts";
import { ruleTester } from "./ruleTester.ts";

// cspell:ignore café cafè naïve piñata résumé

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
{
    "cafe\u0301": "value"
}
`,
			snapshot: `
{
    "cafe\u0301": "value"
    ~~~~~~~
    This key is not normalized using the NFC normalization form.
}
`,
			suggestions: [
				{
					id: "normalizeKey",
					updated: `
{
    "café": "value"
}
`,
				},
			],
		},
		{
			code: `
{
    "résumé": "document",
    "cafe\u0301": "latte"
}
`,
			snapshot: `
{
    "résumé": "document",
    "cafe\u0301": "latte"
    ~~~~~~~
    This key is not normalized using the NFC normalization form.
}
`,
			suggestions: [
				{
					id: "normalizeKey",
					updated: `
{
    "résumé": "document",
    "café": "latte"
}
`,
				},
			],
		},
		{
			code: `
{
    "café": "value"
}
`,
			options: {
				form: "NFD",
			},
			snapshot: `
{
    "café": "value"
    ~~~~~~
    This key is not normalized using the NFD normalization form.
}
`,
			suggestions: [
				{
					id: "normalizeKey",
					updated: `
{
    "cafe\u0301": "value"
}
`,
				},
			],
		},
		{
			code: `
{
    "café": "espresso",
    "naïve": "approach"
}
`,
			options: {
				form: "NFD",
			},
			snapshot: `
{
    "café": "espresso",
    ~~~~~~
    This key is not normalized using the NFD normalization form.
    "naïve": "approach"
    ~~~~~~~
    This key is not normalized using the NFD normalization form.
}
`,
			suggestions: [
				{
					id: "normalizeKey",
					updated: `
{
    "cafe\u0301": "espresso",
    "naïve": "approach"
}
`,
				},
				{
					id: "normalizeKey",
					updated: `
{
    "café": "espresso",
    "nai\u0308ve": "approach"
}
`,
				},
			],
		},
	],
	valid: [
		`{}`,
		`{ "simple": "value" }`,
		`{ "no_special_chars": true }`,
		`
{
    "café": "value"
}
`,
		`
{
    "résumé": "document",
    "naïve": "approach",
    "piñata": "party"
}
`,
		{
			code: `
{
    "cafe\u0301": "value"
}
`,
			options: {
				form: "NFD",
			},
		},
	],
});
