/* cspell:disable */
import { describe, expect, it } from "vitest";

import { createIssueMessage } from "./cspell.ts";
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

describe("createIssueMessage", () => {
	it("includes replacement suggestion when withReplacement is true", () => {
		const message = createIssueMessage({ withReplacement: true });

		expect(message.suggestions).toHaveLength(2);
		expect(message.suggestions[0]).toBe('Add "{{ word }}" to dictionary.');
		expect(message.suggestions[1]).toBe(
			'Replace with "{{ replacement }}" or another known word.',
		);
	});

	it("does not include replacement suggestion when withReplacement is false or undefined", () => {
		const messageWithout = createIssueMessage({ withReplacement: false });
		const messageDefault = createIssueMessage();

		expect(messageWithout.suggestions).toHaveLength(1);
		expect(messageWithout.suggestions[0]).toBe(
			'Add "{{ word }}" to dictionary.',
		);

		expect(messageDefault.suggestions).toHaveLength(1);
		expect(messageDefault.suggestions[0]).toBe(
			'Add "{{ word }}" to dictionary.',
		);
	});
});
