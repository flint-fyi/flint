import rule from "./regexUnusedCapturingGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/(a)/;
`,
			snapshot: `
/(a)/;
 ~~~
 Capturing group \`(a)\` is never referenced.
`,
			suggestions: [
				{
					id: "useNonCapturing",
					updated: `
/(?:a)/;
`,
				},
			],
		},
		{
			code: `
/(a)(b)/;
`,
			snapshot: `
/(a)(b)/;
 ~~~
 Capturing group \`(a)\` is never referenced.
    ~~~
    Capturing group \`(b)\` is never referenced.
`,
			suggestions: [
				{
					id: "useNonCapturing",
					updated: `
/(?:a)(b)/;
`,
				},
				{
					id: "useNonCapturing",
					updated: `
/(a)(?:b)/;
`,
				},
			],
		},
		{
			code: `
/(?<name>a)/;
`,
			snapshot: `
/(?<name>a)/;
 ~~~~~~~~~~
 Capturing group \`(?<name>a)\` is never referenced.
`,
			suggestions: [
				{
					id: "useNonCapturing",
					updated: `
/(?:a)/;
`,
				},
			],
		},
		{
			code: String.raw`
/(a)(b)\1/;
`,
			snapshot: `
/(a)(b)\\1/;
    ~~~
    Capturing group \`(b)\` is never referenced.
`,
			suggestions: [
				{
					id: "useNonCapturing",
					updated: String.raw`
/(a)(?:b)\1/;
`,
				},
			],
		},
		{
			code: String.raw`
/(?<first>a)(?<second>b)\k<first>/;
`,
			snapshot: `
/(?<first>a)(?<second>b)\\k<first>/;
            ~~~~~~~~~~~~
            Capturing group \`(?<second>b)\` is never referenced.
`,
			suggestions: [
				{
					id: "useNonCapturing",
					updated: String.raw`
/(?<first>a)(?:b)\k<first>/;
`,
				},
			],
		},
		{
			code: `
new RegExp("(a)");
`,
			snapshot: `
new RegExp("(a)");
            ~~~
            Capturing group \`(a)\` is never referenced.
`,
			suggestions: [
				{
					id: "useNonCapturing",
					updated: `
new RegExp("(?:a)");
`,
				},
			],
		},
		{
			code: `
RegExp("(hello)");
`,
			snapshot: `
RegExp("(hello)");
        ~~~~~~~
        Capturing group \`(hello)\` is never referenced.
`,
			suggestions: [
				{
					id: "useNonCapturing",
					updated: `
RegExp("(?:hello)");
`,
				},
			],
		},
		{
			code: `
/(nested(group))/;
`,
			snapshot: `
/(nested(group))/;
 ~~~~~~~~~~~~~~~
 Capturing group \`(nested(group))\` is never referenced.
        ~~~~~~~
        Capturing group \`(group)\` is never referenced.
`,
			suggestions: [
				{
					id: "useNonCapturing",
					updated: `
/(?:nested(group))/;
`,
				},
				{
					id: "useNonCapturing",
					updated: `
/(nested(?:group))/;
`,
				},
			],
		},
	],
	valid: [
		String.raw`/(a)\1/;`,
		String.raw`/\1(a)/;`,
		String.raw`/(a)(b)\1\2/;`,
		String.raw`/(?<name>a)\k<name>/;`,
		String.raw`/(?<first>a)(?<second>b)\k<first>\k<second>/;`,
		`/(?:a)/;`,
		`/(?:abc)/;`,
		`/(?=a)/;`,
		`/(?!a)/;`,
		`/(?<=a)/;`,
		`/(?<!a)/;`,
		`new RegExp("(a)\\\\1");`,
		`RegExp(variable);`,
	],
});
