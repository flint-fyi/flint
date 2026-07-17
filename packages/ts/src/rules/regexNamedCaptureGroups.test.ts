import rule from "./regexNamedCaptureGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/([0-9]{4})/;
`,
			snapshot: `
/([0-9]{4})/;
 ~~~~~~~~~~
 Anonymous capture group \`([0-9]{4})\` should be converted to a named or non-capturing group for clarity.
`,
			suggestions: [
				{
					id: "addGroupName",
					updated: `
/(?<name>[0-9]{4})/;
`,
				},
				{
					id: "convertToNonCapturing",
					updated: `
/(?:[0-9]{4})/;
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
 Anonymous capture group \`(a)\` should be converted to a named or non-capturing group for clarity.
    ~~~
    Anonymous capture group \`(b)\` should be converted to a named or non-capturing group for clarity.
`,
			suggestions: [
				{
					id: "addGroupName",
					updated: `
/(?<name>a)(b)/;
`,
				},
				{
					id: "convertToNonCapturing",
					updated: `
/(?:a)(b)/;
`,
				},
				{
					id: "addGroupName",
					updated: `
/(a)(?<name>b)/;
`,
				},
				{
					id: "convertToNonCapturing",
					updated: `
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
                   Anonymous capture group \`(\\w{5})\` should be converted to a named or non-capturing group for clarity.
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
			code: `
/(a)/v;
`,
			snapshot: `
/(a)/v;
 ~~~
 Anonymous capture group \`(a)\` should be converted to a named or non-capturing group for clarity.
`,
			suggestions: [
				{
					id: "addGroupName",
					updated: `
/(?<name>a)/v;
`,
				},
				{
					id: "convertToNonCapturing",
					updated: `
/(?:a)/v;
`,
				},
			],
		},
		{
			code: `
/(?<outer>(?<inner>a)(b))/;
`,
			snapshot: `
/(?<outer>(?<inner>a)(b))/;
                     ~~~
                     Anonymous capture group \`(b)\` should be converted to a named or non-capturing group for clarity.
`,
			suggestions: [
				{
					id: "addGroupName",
					updated: `
/(?<outer>(?<inner>a)(?<name>b))/;
`,
				},
				{
					id: "convertToNonCapturing",
					updated: `
/(?<outer>(?<inner>a)(?:b))/;
`,
				},
			],
		},
		{
			code: `
new RegExp("([0-9]{4})");
`,
			snapshot: `
new RegExp("([0-9]{4})");
            ~~~~~~~~~~
            Anonymous capture group \`([0-9]{4})\` should be converted to a named or non-capturing group for clarity.
`,
			suggestions: [
				{
					id: "addGroupName",
					updated: `
new RegExp("(?<name>[0-9]{4})");
`,
				},
				{
					id: "convertToNonCapturing",
					updated: `
new RegExp("(?:[0-9]{4})");
`,
				},
			],
		},
		{
			code: `
RegExp("(a)(b)");
`,
			snapshot: `
RegExp("(a)(b)");
        ~~~
        Anonymous capture group \`(a)\` should be converted to a named or non-capturing group for clarity.
           ~~~
           Anonymous capture group \`(b)\` should be converted to a named or non-capturing group for clarity.
`,
			suggestions: [
				{
					id: "addGroupName",
					updated: `
RegExp("(?<name>a)(b)");
`,
				},
				{
					id: "convertToNonCapturing",
					updated: `
RegExp("(?:a)(b)");
`,
				},
				{
					id: "addGroupName",
					updated: `
RegExp("(a)(?<name>b)");
`,
				},
				{
					id: "convertToNonCapturing",
					updated: `
RegExp("(a)(?:b)");
`,
				},
			],
		},
		{
			code: String.raw`
new RegExp("(?<year>[0-9]{4})-(\\w{5})");
`,
			snapshot:
				String.raw`
new RegExp("(?<year>[0-9]{4})-(\\w{5})");
                              ~~~~~~~
                              Anonymous capture group ` +
				"`" +
				String.raw`(\w{5})` +
				"`" +
				` should be converted to a named or non-capturing group for clarity.
`,
			suggestions: [
				{
					id: "addGroupName",
					updated: String.raw`
new RegExp("(?<year>[0-9]{4})-(?<name>\\w{5})");
`,
				},
				{
					id: "convertToNonCapturing",
					updated: String.raw`
new RegExp("(?<year>[0-9]{4})-(?:\\w{5})");
`,
				},
			],
		},
	],
	valid: [
		"/normal_regex/",
		"/(?:[0-9]{4})/",
		"/(?<year>[0-9]{4})/",
		String.raw`/\u{1F680}/u`,
		"/(?<a>x)(?<b>y)/",
		"/(?<outer>(?<inner>a))/",
		'new RegExp("normal_regex")',
		'new RegExp("(?:[0-9]{4})")',
		'new RegExp("(?<year>[0-9]{4})")',
		'RegExp("(?<a>x)(?<b>y)")',
		"new RegExp(variable)",
	],
});
