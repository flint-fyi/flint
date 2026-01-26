import rule from "./regexRepeatQuantifiers.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: `
/aaa/;
`,
			output: `
/a{3}/;
`,
			snapshot: `
/aaa/;
 ~~~
 Prefer 'a{3}' instead of repeating 'a' 3 times.
`,
		},
		{
			code: `
/\\d\\d/;
`,
			output: `
/\\d{2}/;
`,
			snapshot: `
/\\d\\d/;
 ~~~~
 Prefer '\\d{2}' instead of repeating '\\d' 2 times.
`,
		},
		{
			code: `
/[ab][ab]/;
`,
			output: `
/[ab]{2}/;
`,
			snapshot: `
/[ab][ab]/;
 ~~~~~~~~
 Prefer '[ab]{2}' instead of repeating '[ab]' 2 times.
`,
		},
		{
			code: `
/../;
`,
			output: `
/.{2}/;
`,
			snapshot: `
/../;
 ~~
 Prefer '.{2}' instead of repeating '.' 2 times.
`,
		},
		{
			code: `
/\\d\\d\\d\\d-\\d\\d-\\d\\d/;
`,
			output: `
/\\d{4}-\\d{2}-\\d{2}/;
`,
			snapshot: `
/\\d\\d\\d\\d-\\d\\d-\\d\\d/;
 ~~~~~~~~
 Prefer '\\d{4}' instead of repeating '\\d' 4 times.
          ~~~~
          Prefer '\\d{2}' instead of repeating '\\d' 2 times.
               ~~~~
               Prefer '\\d{2}' instead of repeating '\\d' 2 times.
`,
		},
		{
			code: `
new RegExp("aaa");
`,
			output: `
new RegExp("a{3}");
`,
			snapshot: `
new RegExp("aaa");
            ~~~
            Prefer 'a{3}' instead of repeating 'a' 3 times.
`,
		},
		{
			code: `
new RegExp("aa");
`,
			output: `
new RegExp("a{2}");
`,
			snapshot: `
new RegExp("aa");
            ~~
            Prefer 'a{2}' instead of repeating 'a' 2 times.
`,
		},
		{
			code: `
RegExp("aaa");
`,
			output: `
RegExp("a{3}");
`,
			snapshot: `
RegExp("aaa");
        ~~~
        Prefer 'a{3}' instead of repeating 'a' 3 times.
`,
		},
		{
			code: `
/aaaa/v;
`,
			output: `
/a{4}/v;
`,
			snapshot: `
/aaaa/v;
 ~~~~
 Prefer 'a{4}' instead of repeating 'a' 4 times.
`,
		},
		{
			code: `
/\\w\\w\\w/;
`,
			output: `
/\\w{3}/;
`,
			snapshot: `
/\\w\\w\\w/;
 ~~~~~~
 Prefer '\\w{3}' instead of repeating '\\w' 3 times.
`,
		},
		{
			code: `
/\\1\\1/;
`,
			output: `
/\\1{2}/;
`,
			snapshot: `
/\\1\\1/;
 ~~~~
 Prefer '\\1{2}' instead of repeating '\\1' 2 times.
`,
		},
	],
	valid: [
		`/a{3}/;`,
		`/ab/;`,
		`/abc/;`,
		`/(a)(a)/;`,
		`/(?:a)(?:a)/;`,
		`new RegExp(variable);`,
		`RegExp();`,
		`/[a{2}]/;`,
		`/a*/;`,
		`/a+/;`,
		`/a?/;`,
		`/a{2}/;`,
		`/a{2,}/;`,
		`/a{2,4}/;`,
		`/{{}}/;`,
	],
});
