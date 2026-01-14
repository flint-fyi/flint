import rule from "./escapeSequenceCasing.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `const foo = '\\xa9';`,
			snapshot: `const foo = '\\xa9';
             ~~~~
             Use uppercase characters for escape sequence '\\xa9'.`,
			suggestions: [
				{
					id: "replaceWithUppercase",
					updated: `const foo = '\\XA9';`,
				},
			],
		},
		{
			code: `const foo = '\\ud834';`,
			snapshot: `const foo = '\\ud834';
             ~~~~~~
             Use uppercase characters for escape sequence '\\ud834'.`,
			suggestions: [
				{
					id: "replaceWithUppercase",
					updated: `const foo = '\\UD834';`,
				},
			],
		},
		{
			code: `const foo = '\\u{1d306}';`,
			snapshot: `const foo = '\\u{1d306}';
             ~~~~~~~~~
             Use uppercase characters for escape sequence '\\u{1d306}'.`,
			suggestions: [
				{
					id: "replaceWithUppercase",
					updated: `const foo = '\\U{1D306}';`,
				},
			],
		},
		{
			code: `const foo = '\\ca';`,
			snapshot: `const foo = '\\ca';
             ~~~
             Use uppercase characters for escape sequence '\\ca'.`,
			suggestions: [
				{
					id: "replaceWithUppercase",
					updated: `const foo = '\\CA';`,
				},
			],
		},
		{
			code: `const foo = "\\xa9";`,
			snapshot: `const foo = "\\xa9";
             ~~~~
             Use uppercase characters for escape sequence '\\xa9'.`,
			suggestions: [
				{
					id: "replaceWithUppercase",
					updated: `const foo = "\\XA9";`,
				},
			],
		},
		{
			code: `const foo = \`\\xa9\`;`,
			snapshot: `const foo = \`\\xa9\`;
             ~~~~
             Use uppercase characters for escape sequence '\\xa9'.`,
			suggestions: [
				{
					id: "replaceWithUppercase",
					updated: `const foo = \`\\XA9\`;`,
				},
			],
		},
		{
			code: `const x = 5;
const foo = \`value: \${x} \\xa9\`;`,
			snapshot: `const x = 5;
const foo = \`value: \${x} \\xa9\`;
                         ~~~~
                         Use uppercase characters for escape sequence '\\xa9'.`,
			suggestions: [
				{
					id: "replaceWithUppercase",
					updated: `const x = 5;
const foo = \`value: \${x} \\XA9\`;`,
				},
			],
		},
	],
	valid: [
		`const foo = '\\xA9';`,
		`const foo = '\\uD834';`,
		`const foo = '\\u{1D306}';`,
		`const foo = '\\cA';`,
		`const foo = "\\xA9";`,
		`const foo = \`\\xA9\`;`,
		`const foo = 'hello';`,
		`const foo = '\\n\\t\\r';`,
	],
});
