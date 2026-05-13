import rule from "./regexMisleadingCapturingGroups.ts";
import { ruleTester } from "./ruleTester.ts";

ruleTester.describe(rule, {
	invalid: [
		{
			code: String.raw`
/\d+(\d*)/;
`,
			snapshot: String.raw`
/\d+(\d*)/;
     ~~~
     Capturing group with '\d*' will always capture the empty string because '\d+' consumes matching characters first.
`,
		},
		{
			code: String.raw`
/a+(a*)/;
`,
			snapshot: String.raw`
/a+(a*)/;
    ~~
    Capturing group with 'a*' will always capture the empty string because 'a+' consumes matching characters first.
`,
		},
		{
			code: String.raw`
/a+(a+)/;
`,
			snapshot: String.raw`
/a+(a+)/;
    ~~
    Capturing group with 'a+' will always capture only 1 character because 'a+' consumes matching characters first.
`,
		},
		{
			code: String.raw`
/\w+(\w{2,})/;
`,
			snapshot: String.raw`
/\w+(\w{2,})/;
     ~~~~~~
     Capturing group with '\w{2,}' will always capture only 2 characters because '\w+' consumes matching characters first.
`,
		},
		{
			code: String.raw`
/^(a*).+/;
`,
			snapshot: String.raw`
/^(a*).+/;
   ~~
   Quantifier 'a*' at the end of capturing group may capture less than expected due to backtracking.
`,
		},
		{
			code: String.raw`
new RegExp("\\d+(\\d*)");
`,
			snapshot: String.raw`
new RegExp("\\d+(\\d*)");
                ~~~
                Capturing group with '\d*' will always capture the empty string because '\d+' consumes matching characters first.
`,
		},
		{
			code: String.raw`
/[a-z]+([a-z]*)/;
`,
			snapshot: String.raw`
/[a-z]+([a-z]*)/;
        ~~~~~~
        Capturing group with '[a-z]*' will always capture the empty string because '[a-z]+' consumes matching characters first.
`,
		},
	],
	valid: [
		`RegExp(variable);`,
		String.raw`/(a+)/;`,
		String.raw`/(a+a+)/;`,
		String.raw`/(a+a+)b+/;`,
		String.raw`/\$(\d+)/g;`,
		String.raw`/\b(?:id|name)=["']([^"']+)["']/g;`,
		String.raw`/\d+(\w*)/;`,
		String.raw`/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(e)([+-]?)(\d+)$/i;`,
		String.raw`/^(a*)$/;`,
		String.raw`/^[+-]?\d+\.(\d+)(?:e[+-]?\d+)?$/i;`,
		String.raw`/^\/(.*)\/([dgimsuyv]*)$/;`,
		String.raw`/^\/(.+)\/([dgimsuyv]*)$/;`,
		String.raw`/^\/\/\s*flint-(\S+)(?:\s+(.+))?/;`,
		String.raw`/^\s*flint-(\S+)(?:\s+(.+))?/;`,
		String.raw`/a+(b*)/;`,
		String.raw`/a+a+/;`,
		String.raw`new RegExp("a+(b*)");`,
	],
});
