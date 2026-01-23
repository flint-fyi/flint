import rule from "./regexEmptyCapturingGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/()/;
`,
			snapshot: `
/()/;
 ~~
 This capturing group captures only empty strings.
`,
		},
		{
			code: `
/a()/;
`,
			snapshot: `
/a()/;
  ~~
  This capturing group captures only empty strings.
`,
		},
		{
			code: `
/()b/;
`,
			snapshot: `
/()b/;
 ~~
 This capturing group captures only empty strings.
`,
		},
		{
			code: `
/(|)/;
`,
			snapshot: `
/(|)/;
 ~~~
 This capturing group captures only empty strings.
`,
		},
		{
			code: `
/(||)/;
`,
			snapshot: `
/(||)/;
 ~~~~
 This capturing group captures only empty strings.
`,
		},
		{
			code: String.raw`
/(\b)/;
`,
			snapshot: `
/(\\b)/;
 ~~~~
 This capturing group captures only empty strings.
`,
		},
		{
			code: `
/(^)/;
`,
			snapshot: `
/(^)/;
 ~~~
 This capturing group captures only empty strings.
`,
		},
		{
			code: `
/($)/;
`,
			snapshot: `
/($)/;
 ~~~
 This capturing group captures only empty strings.
`,
		},
		{
			code: `
/((?=a))/;
`,
			snapshot: `
/((?=a))/;
 ~~~~~~~
 This capturing group captures only empty strings.
`,
		},
		{
			code: `
/((?!a))/;
`,
			snapshot: `
/((?!a))/;
 ~~~~~~~
 This capturing group captures only empty strings.
`,
		},
		{
			code: `
/((?<=a))/;
`,
			snapshot: `
/((?<=a))/;
 ~~~~~~~~
 This capturing group captures only empty strings.
`,
		},
		{
			code: `
/((?<!a))/;
`,
			snapshot: `
/((?<!a))/;
 ~~~~~~~~
 This capturing group captures only empty strings.
`,
		},
		{
			code: `
/(a?)?/;
`,
			snapshot: `
/(a?)?/;
 ~~~~
 This capturing group captures only empty strings.
`,
		},
		{
			code: `
/(a*)/;
`,
			snapshot: `
/(a*)/;
 ~~~~
 This capturing group captures only empty strings.
`,
		},
		{
			code: `
new RegExp("()");
`,
			snapshot: `
new RegExp("()");
            ~~
            This capturing group captures only empty strings.
`,
		},
		{
			code: `
RegExp("(\\\\b)");
`,
			snapshot: `
RegExp("(\\\\b)");
        ~~~~
        This capturing group captures only empty strings.
`,
		},
	],
	valid: [
		`/a/;`,
		`/(a)/;`,
		`/(abc)/;`,
		`/(?:)/;`,
		`/(?:a)/;`,
		`/(?=a)/;`,
		`/(?!a)/;`,
		`/(a|b)/;`,
		`/(a|)/;`,
		`/(a+)/;`,
		`/(a{1,})/;`,
		`/([a-z])/;`,
		`/(\\d)/;`,
		`/(\\w)/;`,
		`/(.)/;`,
		`new RegExp("(a)");`,
		`new RegExp(variable);`,
		`/(a|b|c)/;`,
	],
});
