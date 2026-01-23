import rule from "./regexNamedCaptureGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/([0-9]{4})/;
`,
			snapshot: `
/([0-9]{4})/;
 ~~~~~~~~~~
 Capture group \`([0-9]{4})\` should be converted to a named or non-capturing group.
`,
			suggestions: [
				{
					id: "addGroupName",
					updated: String.raw`
/(?<name>[0-9]{4})/;
`,
				},
				{
					id: "convertToNonCapturing",
					updated: String.raw`
/(?:[0-9]{4})/;
`,
				},
			],
		},
		{
			code: String.raw`
/(a)(b)/;
`,
			snapshot: `
/(a)(b)/;
 ~~~
 Capture group \`(a)\` should be converted to a named or non-capturing group.
    ~~~
    Capture group \`(b)\` should be converted to a named or non-capturing group.
`,
			suggestions: [
				{
					id: "addGroupName",
					updated: String.raw`
/(?<name>a)(b)/;
`,
				},
				{
					id: "convertToNonCapturing",
					updated: String.raw`
/(?:a)(b)/;
`,
				},
				{
					id: "addGroupName",
					updated: String.raw`
/(a)(?<name>b)/;
`,
				},
				{
					id: "convertToNonCapturing",
					updated: String.raw`
/(a)(?:b)/;
`,
				},
			],
		},
		{
			code: String.raw`
/(?<year>[0-9]{4})-(\w{5})/;
`,
			snapshot: `
/(?<year>[0-9]{4})-(\\w{5})/;
                   ~~~~~~~
                   Capture group \`(\\w{5})\` should be converted to a named or non-capturing group.
`,
			suggestions: [
				{
					id: "addGroupName",
					updated: String.raw`
/(?<year>[0-9]{4})-(?<name>\w{5})/;
`,
				},
				{
					id: "convertToNonCapturing",
					updated: String.raw`
/(?<year>[0-9]{4})-(?:\w{5})/;
`,
				},
			],
		},
		{
			code: String.raw`
/(a)/v;
`,
			snapshot: `
/(a)/v;
 ~~~
 Capture group \`(a)\` should be converted to a named or non-capturing group.
`,
			suggestions: [
				{
					id: "addGroupName",
					updated: String.raw`
/(?<name>a)/v;
`,
				},
				{
					id: "convertToNonCapturing",
					updated: String.raw`
/(?:a)/v;
`,
				},
			],
		},
		{
			code: String.raw`
/(?<outer>(?<inner>a)(b))/;
`,
			snapshot: `
/(?<outer>(?<inner>a)(b))/;
                     ~~~
                     Capture group \`(b)\` should be converted to a named or non-capturing group.
`,
			suggestions: [
				{
					id: "addGroupName",
					updated: String.raw`
/(?<outer>(?<inner>a)(?<name>b))/;
`,
				},
				{
					id: "convertToNonCapturing",
					updated: String.raw`
/(?<outer>(?<inner>a)(?:b))/;
`,
				},
			],
		},
	],
	valid: [
		String.raw`/normal_regex/`,
		String.raw`/(?:[0-9]{4})/`,
		String.raw`/(?<year>[0-9]{4})/`,
		String.raw`/\u{1F680}/u`,
		String.raw`/(?<a>x)(?<b>y)/`,
		String.raw`/(?<outer>(?<inner>a))/`,
	],
});
