/* cspell:disable */
import rule from "./cspell.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
                incorect
            `,
			snapshot: `
                incorect
                ~~~~~~~~
                Forbidden or unknown word: "incorect".
            `,
			suggestions: [
				{
					files: {
						"cspell.json": [
							{
								original: ``,
								updated: '{"words":["incorect"]}',
							},
							{
								original: `{}`,
								updated: '{"words":["incorect"]}',
							},
							{
								original: `{"words":[]}`,
								updated: '{"words":["incorect"]}',
							},
							{
								original: `{"words":["existing"]}`,
								updated: '{"words":["existing","incorect"]}',
							},
						],
					},
					id: "addWordToWords",
				},
			],
		},
	],
	valid: ["", "known", "known-word", "knownWord"],
});
