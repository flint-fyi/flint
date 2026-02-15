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
		{
			code: `
                const myarray = [];
            
`,
			snapshot: `
                const myarray = [];
                      ~~~~~~~
                      Forbidden or unknown word: "myarray".
            
`,
			suggestions: [
				{
					files: {
						"cspell.json": [
							{
								original: ``,
								updated: '{"words":["myarray"]}',
							},
							{
								original: `{}`,
								updated: '{"words":["myarray"]}',
							},
							{
								original: `{"words":[]}`,
								updated: '{"words":["myarray"]}',
							},
							{
								original: `{"words":["existing"]}`,
								updated: '{"words":["existing","myarray"]}',
							},
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                qwertyuiop
            
`,
			snapshot: `
                qwertyuiop
                ~~~~~~~~~~
                Forbidden or unknown word: "qwertyuiop".
            
`,
			suggestions: [
				{
					files: {
						"cspell.json": [
							{
								original: ``,
								updated: '{"words":["qwertyuiop"]}',
							},
							{
								original: `{}`,
								updated: '{"words":["qwertyuiop"]}',
							},
							{
								original: `{"words":[]}`,
								updated: '{"words":["qwertyuiop"]}',
							},
							{
								original: `{"words":["existing"]}`,
								updated: '{"words":["existing","qwertyuiop"]}',
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
