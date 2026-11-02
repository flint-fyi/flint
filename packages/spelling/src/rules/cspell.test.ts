/* cspell:disable */
import rule from "./cspell.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			files: {
				"src/example.txt": `
                incorect
`,
			},
			snapshot: `
                incorect
                ~~~~~~~~
                Forbidden or unknown word: "incorect".
`,
			suggestions: [
				{
					files: {
						"cspell.json": [
							{ original: ``, updated: '{"words":["incorect"]}' },
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                incorect
`,
			files: { "cspell.json": "{}" },
			snapshot: `
                incorect
                ~~~~~~~~
                Forbidden or unknown word: "incorect".
`,
			suggestions: [
				{
					files: {
						"cspell.json": [
							{ original: `{}`, updated: '{"words":["incorect"]}' },
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                incorect
            
`,
			files: { "cspell.json": '{"words":[]}' },
			snapshot: `
                incorect
                ~~~~~~~~
                Forbidden or unknown word: "incorect".
            
`,
			suggestions: [
				{
					files: {
						"cspell.json": [
							{ original: `{"words":[]}`, updated: '{"words":["incorect"]}' },
						],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			files: {
				"cspell.json": '{"words":["existing"]}',
				"src/example.txt": `
                incorect
            
`,
			},
			snapshot: {
				"src/example.txt": `
                incorect
                ~~~~~~~~
                Forbidden or unknown word: "incorect".
            
`,
			},
			suggestions: [
				{
					files: {
						"cspell.json": [
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
						"cspell.json": [{ original: ``, updated: '{"words":["myarray"]}' }],
					},
					id: "addWordToWords",
				},
			],
		},
		{
			code: `
                const myarray = [];
            
`,
			files: { "cspell.json": "{}" },
			snapshot: `
                const myarray = [];
                      ~~~~~~~
                      Forbidden or unknown word: "myarray".
            
`,
			suggestions: [
				{
					files: {
						"cspell.json": [
							{ original: `{}`, updated: '{"words":["myarray"]}' },
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
			files: { "cspell.json": '{"words":[]}' },
			snapshot: `
                const myarray = [];
                      ~~~~~~~
                      Forbidden or unknown word: "myarray".
            
`,
			suggestions: [
				{
					files: {
						"cspell.json": [
							{ original: `{"words":[]}`, updated: '{"words":["myarray"]}' },
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
			files: { "cspell.json": '{"words":["existing"]}' },
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
							{ original: ``, updated: '{"words":["qwertyuiop"]}' },
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
			files: { "cspell.json": "{}" },
			snapshot: `
                qwertyuiop
                ~~~~~~~~~~
                Forbidden or unknown word: "qwertyuiop".
            
`,
			suggestions: [
				{
					files: {
						"cspell.json": [
							{ original: `{}`, updated: '{"words":["qwertyuiop"]}' },
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
			files: { "cspell.json": '{"words":[]}' },
			snapshot: `
                qwertyuiop
                ~~~~~~~~~~
                Forbidden or unknown word: "qwertyuiop".
            
`,
			suggestions: [
				{
					files: {
						"cspell.json": [
							{ original: `{"words":[]}`, updated: '{"words":["qwertyuiop"]}' },
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
			files: { "cspell.json": '{"words":["existing"]}' },
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
	valid: [
		"",
		"known",
		"known-word",
		"knownWord",
		{
			files: {
				"cspell.json": '{"words":["incorect"]}',
				"src/example.txt": "incorect",
			},
		},
		{
			files: {
				"cspell.json": '{"words":["existing","incorect"]}',
				"src/example.txt": "incorect",
			},
		},
	],
});
