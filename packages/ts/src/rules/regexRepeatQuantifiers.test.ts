import rule from "./regexRepeatQuantifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/aaaaa/;
`,
			output: `
/a{5}/;
`,
			snapshot: `
/aaaaa/;
 ~~~~~
 Prefer \`a{5}\` instead of repeating \`a\` 5 times.
`,
		},
		{
			code: `
/\\d\\d\\d\\d\\d-\\d\\d\\d\\d\\d/;
`,
			output: `
/\\d{5}-\\d{5}/;
`,
			snapshot: `
/\\d\\d\\d\\d\\d-\\d\\d\\d\\d\\d/;
 ~~~~~~~~~~
 Prefer \`\\d{5}\` instead of repeating \`\\d\` 5 times.
            ~~~~~~~~~~
            Prefer \`\\d{5}\` instead of repeating \`\\d\` 5 times.
`,
		},
		{
			code: `
/[ab][ab][ab][ab][ab]/;
`,
			output: `
/[ab]{5}/;
`,
			snapshot: `
/[ab][ab][ab][ab][ab]/;
 ~~~~~~~~~~~~~~~~~~~~
 Prefer \`[ab]{5}\` instead of repeating \`[ab]\` 5 times.
`,
		},
		{
			code: `
/...../;
`,
			output: `
/.{5}/;
`,
			snapshot: `
/...../;
 ~~~~~
 Prefer \`.{5}\` instead of repeating \`.\` 5 times.
`,
		},
		{
			code: `
new RegExp("aaaaa");
`,
			output: `
new RegExp("a{5}");
`,
			snapshot: `
new RegExp("aaaaa");
            ~~~~~
            Prefer \`a{5}\` instead of repeating \`a\` 5 times.
`,
		},
		{
			code: `
/\\w\\w\\w\\w\\w/;
`,
			output: `
/\\w{5}/;
`,
			snapshot: `
/\\w\\w\\w\\w\\w/;
 ~~~~~~~~~~
 Prefer \`\\w{5}\` instead of repeating \`\\w\` 5 times.
`,
		},
		{
			code: `
/\\1\\1\\1\\1\\1/;
`,
			output: `
/\\1{5}/;
`,
			snapshot: `
/\\1\\1\\1\\1\\1/;
 ~~~~~~~~~~
 Prefer \`\\1{5}\` instead of repeating \`\\1\` 5 times.
`,
		},
	],
	valid: [
		`/a{3}/;`,
		`/ab/;`,
		`/abc/;`,
		`/a{2,}/;`,
		`/a{2,4}/;`,
		`/{{}}/;`,
		`/aaa/;`,
		`/aaaa/;`,
		`/\\d\\d/;`,
		`/[ab][ab]/;`,
		`/../;`,
		`/\\w\\w\\w/;`,
		`/\\1\\1/;`,
		`new RegExp("aaaa");`,
		`RegExp("aaaa");`,
	],
});
